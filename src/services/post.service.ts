import { db } from "../db/postgres/db.postgres";
import {
  usersTable,
  groups,
  groupMembers,
  posts,
  postApprovals,
  media,
} from "../db/postgres/schemas";
import { permissionService } from "./permission.service";
import { notificationService } from "./notification.service";
import { cacheService } from "./redis_cache.service";
import {
  cloudinaryDeleteImage,
  cloudinaryGetPublicIdFromUrl,
} from "../config/cloudinary.config";
import type {
  CreatePostInput,
  UpdatePostInput,
} from "../utils/PostSchemas/post.validation";
import { AppAssert } from "../utils/AppAssert";
import { STATUS_CODE } from "../types/httpStatus";
import { ApiError } from "../utils/ApiError";
import { and, eq, desc } from "drizzle-orm";
import { CacheInvalidation } from "../utils/cache-invalidation";
export class PostServices {
  private readonly CACHE_TTL_SHORT = parseInt(
    process.env.CACHE_TTL_SHORT || "300"
  );
  private readonly CACHE_TTL_MEDIUM = parseInt(
    process.env.CACHE_TTL_MEDIUM || "1800"
  );
  // Create a new post (draft mode)
  //submitPostForApproval
  //approvePost
  //rejectPost
  //updatePost
  //deletePost
  //getPostById
  //getGroupPosts
  //getPendingPosts
  //getUserPosts
  //addMediaToPost
  //removeMediaFromPost
  async createPost(userId: string, input: CreatePostInput) {
    // first get the input
    // then check if the user has the role in the group
    // then check if he canPost
    // then check if he has the Permission to post
    // then create the post
    // then return the post
    const { groupId, title, subtitle, content, visibility } = input;

    const hasRole = await permissionService.getUserRole(userId, groupId);

    AppAssert(
      hasRole,
      STATUS_CODE.BAD_REQUEST,
      "You are not member of this Group"
    );

    if (!hasRole.canPost) {
      throw new ApiError(
        STATUS_CODE.UNAUTHORIZED,
        "You don't have persmission to post in this group"
      );
    }

    const [post] = await db
      .insert(posts)
      .values({
        groupId,
        authorId: userId,
        title,
        subTitle: subtitle || "",
        content,
        status: "draft",
        visibility: visibility || "public",
      })
      .returning();

    // Invalidate related caches
    await cacheService.invalidateRelated([
      `post:group:${groupId}*`,
      `post:user:${userId}*`,
    ]);

    return post;
  }

  async submitForApproval(postId: string, userId: string) {
    // get post, and validate it
    const [post] = await db.select().from(posts).where(eq(posts.id, postId));
    AppAssert(post, STATUS_CODE.NOT_FOUND, "Post with this id not found");
    // check if user is the author
    if (post.authorId !== userId) {
      throw new ApiError(
        STATUS_CODE.UNAUTHORIZED,
        "You are not author of this post"
      );
    }
    // check if status is draft or not
    if (post.status !== "draft") {
      throw new ApiError(
        STATUS_CODE.BAD_REQUEST,
        "Only drafted post can be sent for approval"
      );
    }

    // check group if approval is required
    const [group] = await db
      .select()
      .from(groups)
      .where(eq(groups.id, post.groupId));

    AppAssert(group, STATUS_CODE.NOT_FOUND, "Group not found");

    // check if user is the owner of group
    const isOwnerOfTheGroup = await permissionService.isOwner(
      userId,
      post.groupId
    );

    if (isOwnerOfTheGroup || !group.requiresApproval) {
      await db
        .update(posts)
        .set({
          status: "published",
          submittedAt: new Date(),
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(posts.id, postId));

      // Invalidate caches
      await cacheService.deletePattern(`post:${postId}*`);
      await cacheService.invalidateRelated([
        `post:group:${post.groupId}*`,
        `post:user:${userId}*`,
      ]);

      return { status: "published", message: "Post published successfully" };
    }

    // if now owner or doesn't skips group approval then
    await db
      .update(posts)
      .set({
        status: "pending_approval",
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId));

    // Notify all admins and owner
    const adminsAndOwners = await db
      .select({
        userId: groupMembers.userId,
        roleName: groupMembers.roleId,
      })
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, post.groupId),
          eq(groupMembers.isActive, true)
        )
      );

    const [author] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    AppAssert(author, STATUS_CODE.NOT_FOUND, "Author not found");

    for (const member of adminsAndOwners) {
      const role = await permissionService.getRoleById(member.roleName);
      AppAssert(
        role && role.length > 0 && role[0],
        STATUS_CODE.NOT_FOUND,
        "Role not found for group member"
      );

      const memberRole = role[0]!;
      if (memberRole.name === "Owner" || memberRole.name === "Admin") {
        await notificationService.createNotification({
          userId: member.userId,
          type: "post_approval",
          relatedEntityType: "post",
          relatedEntityId: postId,
          message: `${author.username} submitted "${post.title}" for approval`,
        });
      }
    }

    // Invalidate caches
    await cacheService.deletePattern(`post:${postId}*`);
    await cacheService.deletePattern(`post:pending:*`);

    return {
      status: "pending_approval",
      message: "Post submitted for approval",
    };
  }

  async approvePost(postId: string, reviewerId: string) {
    const [post] = await db.select().from(posts).where(eq(posts.id, postId));

    AppAssert(post, STATUS_CODE.NOT_FOUND, "Post with this ID not found");

    const hasPermission = await permissionService.hasPermission(
      reviewerId,
      post.groupId,
      "post:approve"
    );
    AppAssert(
      hasPermission,
      STATUS_CODE.UNAUTHORIZED,
      "You don't have permission to approve this post"
    );

    if (post.status !== "pending_approval") {
      throw new Error("Post is not pending approval");
    }

    await db
      .update(posts)
      .set({
        status: "published",
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId));

    await db
      .update(postApprovals)
      .set({
        status: "approved",
        reviewedBy: reviewerId,
        reviewAt: new Date(),
      })
      .where(eq(postApprovals.postId, postId));

    const [reviewer] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, reviewerId));

    AppAssert(
      reviewer,
      STATUS_CODE.NOT_FOUND,
      "Reviewer with this id not found"
    );

    await notificationService.createNotification({
      userId: post.authorId,
      type: "post_approved",
      relatedEntityType: "post",
      relatedEntityId: postId,
      message: `Your post "${post.title}" was approved by ${reviewer.username}`,
    });

    // Invalidate related caches
    await cacheService.deletePattern(`post:${postId}*`);
    await cacheService.invalidateRelated([
      `post:group:${post.groupId}*`,
      `post:pending:*`,
      `post:user:${post.authorId}*`,
    ]);

    await CacheInvalidation.invalidatePost(postId, post.groupId);

    return { success: true, message: "Post approval Successful" };
  }

  async rejectPost(
    postId: string,
    reviewerId: string,
    reason: string = "Not good Post"
  ) {
    const [post] = await db.select().from(posts).where(eq(posts.id, postId));

    AppAssert(post, STATUS_CODE.NOT_FOUND, "Post with this id not found");

    const hasPermission = await permissionService.hasPermission(
      reviewerId,
      post.groupId,
      "post:reject"
    );

    AppAssert(
      hasPermission,
      STATUS_CODE.UNAUTHORIZED,
      "You do not have permsission to reject this post"
    );

    if (post.status !== "pending_approval") {
      throw new ApiError(
        STATUS_CODE.BAD_REQUEST,
        "Post is not in pending state"
      );
    }

    await db
      .update(posts)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(posts.id, postId));

    await db
      .update(postApprovals)
      .set({
        status: "rejected",
        reviewedBy: reviewerId,
        reviewAt: new Date(),
        rejectionReason: "reason",
      })
      .where(eq(postApprovals.postId, postId));

    const [reviewer] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, reviewerId));
    AppAssert(
      reviewer,
      STATUS_CODE.NOT_FOUND,
      "Reviewer with this id not found"
    );

    await notificationService.createNotification({
      userId: post.authorId,
      type: "post_rejected",
      relatedEntityType: "post",
      relatedEntityId: postId,
      message: `Your post "${post.title}" was rejected by ${reviewer.username}. Reason: ${reason}`,
    });

    // Invalidate related caches
    await cacheService.deletePattern(`post:${postId}*`);
    await cacheService.deletePattern(`post:pending:*`);

    return { success: true, message: "Post rejected" };
  }

  async updatePost(postId: string, userId: string, input: UpdatePostInput) {
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    AppAssert(post, STATUS_CODE.NOT_FOUND, "Post with this ID not found");

    const isAuthor = post.authorId === userId;
    AppAssert(
      isAuthor,
      STATUS_CODE.UNAUTHORIZED,
      "You are not the author of this post"
    );
    const hasEditPermission = await permissionService.hasPermission(
      userId,
      post.groupId,
      "post:edit"
    );
    AppAssert(
      hasEditPermission,
      STATUS_CODE.UNAUTHORIZED,
      "You do not have permission to edit post"
    );

    let newStatus = post.status;

    // agr post publis vagel xai and still being edited again , then change status to draft again ofc
    if (post.status === "published" && isAuthor) {
      newStatus = "draft";
    }

    const updatedPost = await db
      .update(posts)
      .set({
        ...input,
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId))
      .returning();

    // Invalidate related caches
    await cacheService.deletePattern(`post:${postId}*`);
    await cacheService.invalidateRelated([
      `post:group:${post.groupId}*`,
      `post:user:${userId}*`,
    ]);

    await CacheInvalidation.invalidatePost(postId, post.groupId);

    return updatedPost;
  }

  async deletePost(postId: string, userId: string) {
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    AppAssert(post, STATUS_CODE.NOT_FOUND, "Post with this id not found");

    const isAuthor = post.authorId === userId;
    const hasDeletePermission = await permissionService.hasPermission(
      userId,
      post.groupId,
      "post:delete"
    );

    if (!isAuthor && !hasDeletePermission) {
      throw new ApiError(
        STATUS_CODE.UNAUTHORIZED,
        "You do not have persmission to delete this post"
      );
    }

    // delete post media
    const postMedia = await db
      .select()
      .from(media)
      .where(eq(media.postId, postId));

    for (const mediaItem of postMedia) {
      const publicId = cloudinaryGetPublicIdFromUrl(mediaItem.url);
      if (publicId) {
        await cloudinaryDeleteImage(publicId);
      }
    }

    await db.delete(posts).where(eq(posts.id, postId));

    // Invalidate related caches
    await cacheService.deletePattern(`post:${postId}*`);
    await cacheService.invalidateRelated([
      `post:group:${post.groupId}*`,
      `post:user:${userId}*`,
    ]);

    await CacheInvalidation.invalidatePost(postId, post.groupId);

    return { success: true, messsage: "Post deleted successfully" };
  }

  async getPostById(postId: string, userId?: string) {
    // Try to get from cache
    const cacheKey = userId ? `${postId}:${userId}` : postId;

    type PostWithDetails = {
      post: typeof posts.$inferSelect;
      author: { id: string; username: string | null };
      group: { id: string; name: string };
      media: Array<typeof media.$inferSelect>;
      hasLiked?: boolean;
      likeCount: number;
      commentCount: number;
    };

    const cached = await cacheService.get<PostWithDetails>("post", cacheKey);

    if (cached) {
      return cached;
    }

    const [post] = await db
      .select({
        post: posts,
        author: {
          id: usersTable.id,
          username: usersTable.username,
        },
        group: {
          id: groups.id,
          name: groups.name,
        },
      })
      .from(posts)
      .innerJoin(usersTable, eq(posts.authorId, usersTable.id))
      .innerJoin(groups, eq(posts.groupId, groups.id))
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) {
      return null;
    }

    // Get media
    const postMedia = await db
      .select()
      .from(media)
      .where(eq(media.postId, postId))
      .orderBy(media.order);
    if (userId) {
      const isMember = await permissionService.isMember(
        userId,
        post.post.groupId
      );
      const isAuthor = post.post.authorId === userId;
      const isAdminOrOwner = await permissionService.isOwnerOrAdmin(
        userId,
        post.post.groupId
      );

      // Draft and pending posts only visible to author and admins
      if (
        (post.post.status === "draft" ||
          post.post.status === "pending_approval") &&
        !isAuthor &&
        !isAdminOrOwner
      ) {
        return null;
      }

      // Members-only posts
      if (post.post.visibility === "members_only" && !isMember) {
        return null;
      }
    } else {
      // Guest users can only see published public posts
      if (
        post.post.status !== "published" ||
        post.post.visibility !== "public"
      ) {
        return null;
      }
    }

    const result = {
      ...post,
      media: postMedia,
    };

    // Cache the result (30 minutes)
    await cacheService.set("post", cacheKey, result, this.CACHE_TTL_MEDIUM);

    return result;
  }

  async getGroupPosts(groupId: string, userId?: string, status?: string) {
    // Try to get from cache
    const cacheKey = `group:${groupId}:${status || "published"}:${
      userId || "guest"
    }`;

    type GroupPost = {
      post: typeof posts.$inferSelect;
      author: { id: string; username: string | null };
      media: Array<typeof media.$inferSelect>;
      hasLiked?: boolean;
      likeCount: number;
      commentCount: number;
    };

    const cached = await cacheService.get<GroupPost[]>("post", cacheKey);

    if (cached) {
      return cached;
    }

    const whereConditions = status
      ? and(eq(posts.groupId, groupId), eq(posts.status, status))
      : and(eq(posts.groupId, groupId), eq(posts.status, "published"));

    const groupPosts = await db
      .select({
        post: posts,
        author: {
          id: usersTable.id,
          username: usersTable.username,
        },
      })
      .from(posts)
      .innerJoin(usersTable, eq(posts.authorId, usersTable.id))
      .where(whereConditions)
      .orderBy(desc(posts.publishedAt));
    // Get media for each post
    const postsWithMedia = await Promise.all(
      groupPosts.map(async (item) => {
        const postMedia = await db
          .select()
          .from(media)
          .where(eq(media.postId, item.post.id))
          .orderBy(media.order);

        return {
          ...item,
          media: postMedia,
        };
      })
    );

    // Cache the result (15 minutes)
    await cacheService.set("post", cacheKey, postsWithMedia, 900);

    return postsWithMedia;
  }
  async getPendingPosts(groupId: string, userId: string) {
    const isAdminOrOwner = await permissionService.isOwnerOrAdmin(
      userId,
      groupId
    );

    if (!isAdminOrOwner) {
      throw new ApiError(
        STATUS_CODE.BAD_REQUEST,
        "Only admins and owners can view pending posts"
      );
    }

    // Try to get from cache
    const cacheKey = `pending:${groupId}:${userId}`;

    type PendingPost = {
      post: typeof posts.$inferSelect;
      author: { id: string; username: string | null };
      approval: typeof postApprovals.$inferSelect | null;
      media: Array<typeof media.$inferSelect>;
    };

    const cached = await cacheService.get<PendingPost[]>("post", cacheKey);

    if (cached) {
      return cached;
    }

    const pendingPosts = await db
      .select({
        post: posts,
        author: {
          id: usersTable.id,
          username: usersTable.username,
        },
        approval: postApprovals,
      })
      .from(posts)
      .innerJoin(usersTable, eq(posts.authorId, usersTable.id))
      .innerJoin(postApprovals, eq(posts.id, postApprovals.postId))
      .where(
        and(
          eq(posts.groupId, groupId),
          eq(posts.status, "pending_approval"),
          eq(postApprovals.status, "pending")
        )
      )
      .orderBy(desc(posts.submittedAt));
    const postsWithMedia = await Promise.all(
      pendingPosts.map(async (item) => {
        const postMedia = await db
          .select()
          .from(media)
          .where(eq(media.postId, item.post.id))
          .orderBy(media.order);

        return {
          ...item,
          media: postMedia,
        };
      })
    );

    // Cache the result with shorter TTL (5 minutes)
    await cacheService.set(
      "post",
      cacheKey,
      postsWithMedia,
      this.CACHE_TTL_SHORT
    );

    return postsWithMedia;
  }

  async getUserPosts(userId: string, requesterId?: string) {
    // Try to get from cache
    const cacheKey = `user:${userId}:${requesterId || "guest"}`;

    type UserPost = {
      post: typeof posts.$inferSelect;
      group: { id: string; name: string };
      media: Array<typeof media.$inferSelect>;
      hasLiked?: boolean;
      likeCount: number;
      commentCount: number;
    };

    const cached = await cacheService.get<UserPost[]>("post", cacheKey);

    if (cached) {
      return cached;
    }

    const userPosts = await db
      .select({
        post: posts,
        group: {
          id: groups.id,
          name: groups.name,
        },
      })
      .from(posts)
      .innerJoin(groups, eq(posts.groupId, groups.id))
      .where(eq(posts.authorId, userId))
      .orderBy(desc(posts.createdAt));

    let filteredPosts = userPosts;
    if (requesterId !== userId) {
      // Only show published posts to others
      filteredPosts = userPosts.filter((p) => p.post.status === "published");
    }
    const postsWithMedia = await Promise.all(
      filteredPosts.map(async (item) => {
        const postMedia = await db
          .select()
          .from(media)
          .where(eq(media.postId, item.post.id))
          .orderBy(media.order);

        return {
          ...item,
          media: postMedia,
        };
      })
    );

    // Cache the result (15 minutes)
    await cacheService.set("post", cacheKey, postsWithMedia, 900);

    return postsWithMedia;
  }

  async addMediaToPost(postId: string, userId: string, MediaUrls: string[]) {
    const [post] = await db.select().from(posts).where(eq(posts.id, postId));

    if (!post) {
      throw new ApiError(STATUS_CODE.NOT_FOUND, "Post not found");
    }

    if (post.authorId !== userId) {
      throw new ApiError(
        STATUS_CODE.UNAUTHORIZED,
        "You can only add media to your own posts"
      );
    }
    const alerady_existing_media_in_post = await db
      .select()
      .from(media)
      .where(eq(media.postId, postId));

    if (alerady_existing_media_in_post.length + MediaUrls.length > 5) {
      throw new ApiError(
        STATUS_CODE.BAD_REQUEST,
        "Maximum 5 images allowed per post"
      );
    }

    const mediaToInsert = MediaUrls.map((url, index) => ({
      postId,
      url,
      order: alerady_existing_media_in_post.length + index + 1,
    }));

    const addedMedia = await db.insert(media).values(mediaToInsert).returning();

    // Invalidate post cache
    await cacheService.deletePattern(`post:${postId}*`);

    return addedMedia;
  }

  async removeMediaFromPost(postId: string, mediaId: string, userId: string) {
    const [post] = await db.select().from(posts).where(eq(posts.id, postId));
    if (!post) {
      throw new ApiError(STATUS_CODE.NOT_FOUND, "Post not found");
    }

    if (post.authorId !== userId) {
      throw new ApiError(
        STATUS_CODE.UNAUTHORIZED,
        "You can only delete media from your posts"
      );
    }

    const [mediaItem] = await db
      .select()
      .from(media)
      .where(eq(media.id, mediaId))
      .limit(1);

    if (!mediaItem) {
      throw new ApiError(STATUS_CODE.NOT_FOUND, "Media not found");
    }
    const publicId = cloudinaryGetPublicIdFromUrl(mediaItem.url);
    if (publicId) {
      await cloudinaryDeleteImage(publicId);
    }

    await db.delete(media).where(eq(media.id, mediaId));

    // Invalidate post cache
    await cacheService.deletePattern(`post:${postId}*`);

    return { success: true, message: "Media removed successfully" };
  }
}

export const postServices = new PostServices();
