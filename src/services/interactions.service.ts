import {
  comments,
  likes,
  posts,
  usersTable,
  groupMembers,
} from "../db/postgres/schemas";
import { permissionService } from "./permission.service";
import { notificationService } from "./notification.service";
import { cacheService } from "./redis_cache.service";
import type {
  CreateCommentInput,
  UpdateCommentInput,
} from "../utils/CommentSchemas/interactions";
import { db } from "../db/postgres/db.postgres";
import { eq, and, desc, sql } from "drizzle-orm";
import { ApiError } from "../utils/ApiError";
import { STATUS_CODE } from "../types/httpStatus";
import { AppAssert } from "../utils/AppAssert";

type Comment = {
  id: string;
  userId: string;
  postId: string;
  content: string;
  createdAt: Date;
};

type PostLike = {
  user: {
    id: string;
    username: string;
  };
  likedAt: Date;
};

export class InteractionServices {
  private readonly CACHE_TTL_SHORT = parseInt(
    process.env.CACHE_TTL_SHORT || "300"
  );
  private readonly CACHE_TTL_MEDIUM = parseInt(
    process.env.CACHE_TTL_MEDIUM || "1800"
  );

  // things to do :
  // For comments:

  // createComment
  // get Post comment
  // get post comment count
  // update comment
  // delete comments

  // For likes:

  // like post
  // unlike post
  // has user liked post?
  // get post likes count
  // get post likes
  // get usr liked post

  // Comments:

  async createComment(
    userId: string,
    postId: string,
    input: CreateCommentInput
  ) {
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) {
      throw new ApiError(STATUS_CODE.NOT_FOUND, "Post not found");
    }

    // Check if post is published
    if (post.status !== "published") {
      throw new ApiError(
        STATUS_CODE.BAD_REQUEST,
        "Post is not published, you cannot comment in a unpublished post"
      );
    }

    // Check if user is a member of the group
    const isMember = await permissionService.isMember(userId, post.groupId);

    if (!isMember) {
      throw new ApiError(
        STATUS_CODE.UNAUTHORIZED,
        "You are not member of the group"
      );
    }

    const userRole = await permissionService.getUserRole(userId, post.groupId);

    if (!userRole?.canComment) {
      throw new ApiError(
        STATUS_CODE.UNAUTHORIZED,
        "You do not have permission to comment"
      );
    }

    const [comment] = await db
      .insert(comments)
      .values({
        userId,
        postId,
        content: input.content,
      })
      .returning();

    AppAssert(
      comment,
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      "Error while creating Comment"
    );

    await cacheService.delete("post-comments", postId);
    await cacheService.delete("post-comments-count", postId);

    // Notify post author (if not commenting on own post)
    if (post.authorId !== userId) {
      const [commenter] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, userId));

      await notificationService.createNotification({
        userId: post.authorId,
        type: "comment_reply",
        relatedEntityType: "comment",
        relatedEntityId: comment.id,
        message: `${commenter?.username} commented on your post "${post.title}"`,
      });
    }
    return comment;
  }

  async getPostComments(postId: string) {
    // try cache first
    const cache = await cacheService.get<Comment[]>("post-comment", postId);
    if (cache) {
      return cache;
    }

    // if not in cache , fetch from db
    const postComments = await db
      .select({
        comment: comments,
        user: {
          id: usersTable.id,
          username: usersTable.username,
        },
      })
      .from(comments)
      .innerJoin(usersTable, eq(comments.userId, usersTable.id))
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt));

    // cache the result
    await cacheService.set(
      "post-comments",
      postId,
      postComments,
      this.CACHE_TTL_SHORT
    );
    return postComments;
  }

  async getPostCommentsCount(postId: string) {
    const cache = await cacheService.get<number>("post-comments-count", postId);

    if (cache !== null) {
      return cache;
    }

    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(comments)
      .where(eq(comments.postId, postId));
    const count = result?.count || 0;

    await cacheService.set(
      "post-comments-count",
      postId,
      count,
      this.CACHE_TTL_SHORT
    );
    return count;
  }

  async updateComment(
    commentId: string,
    userId: string,
    input: UpdateCommentInput
  ) {
    const [comment] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, commentId));
    AppAssert(comment, STATUS_CODE.NOT_FOUND, "Comment not found");

    if (comment.userId !== userId) {
      throw new ApiError(
        STATUS_CODE.UNAUTHORIZED,
        "You are not the author of the comment so you can not edit it"
      );
    }

    const updatedComment = await db
      .update(comments)
      .set({
        content: input.content,
      })
      .where(eq(comments.id, commentId))
      .returning();

    await cacheService.delete("post-comments", comment.postId);

    return updatedComment;
  }

  async deleteComment(commentId: string, userId: string) {
    const [comment] = await db
      .select({ comment: comments, post: posts })
      .from(comments)
      .innerJoin(posts, eq(comments.postId, posts.id))
      .where(eq(comments.id, commentId))
      .limit(1);

    if (!comment) {
      throw new ApiError(STATUS_CODE.NOT_FOUND, "Comment not found");
    }

    const isAuthor = comment.comment.userId === userId;

    const hasDeletePermission = await permissionService.hasPermission(
      userId,
      comment.post.groupId,
      "comment:delete"
    );

    if (!isAuthor && !hasDeletePermission) {
      throw new ApiError(
        STATUS_CODE.UNAUTHORIZED,
        "You do not have permission to delete this comment"
      );
    }

    await db.delete(comments).where(eq(comments.id, commentId));

    await cacheService.delete("post-comments", comment.comment.postId);
    await cacheService.delete("post-comments-count", comment.comment.postId);

    return { success: true, message: "Comment deleted successfully" };
  }

  // Likes:

  async likePost(userId: string, postId: string) {
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) {
      throw new ApiError(STATUS_CODE.NOT_FOUND, "Post with this id not found");
    }
    if (post.status !== "published") {
      throw new ApiError(
        STATUS_CODE.BAD_REQUEST,
        "Post is not published yet, can't like it"
      );
    }

    const existingLike = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, usersTable.id), eq(likes.postId, post.id)));

    if (existingLike.length > 0) {
      throw new ApiError(
        STATUS_CODE.CONFLICT,
        "You have already liked this post"
      );
    }

    // create like
    await db.insert(likes).values({
      userId,
      postId,
    });

    await cacheService.increment("post-likes-count", postId);

    await cacheService.addToSet("post-likes", postId, userId);

    await cacheService.delete("post-likes-list", postId);
    if (post.authorId !== userId) {
      const [liker] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, userId));

      await notificationService.createNotification({
        userId: post.authorId,
        type: "post_like",
        relatedEntityType: "post",
        relatedEntityId: postId,
        message: `${liker?.username} liked your post "${post.title}"`,
      });
    }

    return { success: true, message: "Post Liked successfully" };
  }
  async unlikePost(userId: string, postId: string) {
    const existingLike = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.postId, postId)))
      .limit(1);

    if (existingLike.length === 0) {
      throw new ApiError(
        STATUS_CODE.BAD_REQUEST,
        "You have not liked this post"
      );
    }

    await db
      .delete(likes)
      .where(and(eq(likes.userId, userId), eq(likes.postId, postId)));
    await cacheService.decrement("post-likes-count", postId);

    await cacheService.removeFromSet("post-likes", postId, userId);

    await cacheService.delete("post-likes-list", postId);

    return { success: true, message: "Post unliked successfully" };
  }
  async hasUserLikedPost(userId: string, postId: string): Promise<boolean> {
    const inset = await cacheService.isMemberOfSet(
      "post-likes",
      postId,
      userId
    );
    if (inset) {
      return true;
    }

    const existingLike = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.postId, postId)));

    const hasLiked = existingLike.length > 0;

    if (hasLiked) {
      await cacheService.addToSet("post-likes", postId, userId);
    }

    return hasLiked;
  }

  async getPostLikes(postId: string): Promise<PostLike[]> {
    const cache = await cacheService.get<PostLike[]>("post-likes-list", postId);

    if (cache) {
      return cache;
    }

    const postLikes = await db
      .select({
        user: {
          id: usersTable.id,
          username: usersTable.username,
        },
        likedAt: likes.createdAt,
      })
      .from(likes)
      .innerJoin(usersTable, eq(likes.userId, usersTable.id))
      .where(eq(likes.postId, postId))
      .orderBy(desc(likes.createdAt));

    // cache it again
    await cacheService.set(
      "post-likes-list",
      postId,
      postLikes,
      this.CACHE_TTL_SHORT
    );

    return postLikes;
  }

  async getPostLikesCount(postId: string): Promise<number> {
    const cache = await cacheService.get<number>("post-likes-count", postId);

    if (cache !== null) {
      return cache;
    }

    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(likes)
      .where(eq(likes.postId, postId));

    const likesCount = result?.count || 0;

    return likesCount;
  }

  async getUserLikedPost(userId: string) {
    const likedPosts = await db
      .select({ post: posts, likedAt: likes.createdAt })
      .from(likes)
      .innerJoin(posts, eq(likes.postId, posts.id))
      .where(eq(likes.userId, userId))
      .orderBy(desc(likes.createdAt));

    return likedPosts;
  }
}

export const interactionServices = new InteractionServices();
