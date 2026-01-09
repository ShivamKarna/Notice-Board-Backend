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
import { deleteImage, getPublicIdFromUrl } from "../config/cloudinary.config";
import type {
  CreatePostInput,
  UpdatePostInput,
} from "../utils/PostSchemas/post.validation";
import { AppAssert } from "../utils/AppAssert";
import { STATUS_CODE } from "../types/httpStatus";
import { ApiError } from "../utils/ApiError";

export class PostServices {
  // Things to do
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

    return post;
  }
}

export const postServices = new PostServices();
