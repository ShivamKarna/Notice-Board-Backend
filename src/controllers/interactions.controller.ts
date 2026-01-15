import type { Request, Response, NextFunction } from "express";
import { interactionServices } from "../services/interactions.service";
import { ApiError } from "../utils/ApiError";
import { AppAssert } from "../utils/AppAssert";
import { AsyncHandler } from "../utils/AsyncHandler";
import { STATUS_CODE } from "../types/httpStatus";
import { ApiResponse } from "../utils/ApiResponse";

export class InteractionController {
  // Comments
  createComment = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "AUthentication Required");
      }
      const { postId } = req.params;

      AppAssert(postId, STATUS_CODE.NOT_FOUND, "Post Id not given in params");

      const result = await interactionServices.createComment(
        req.user.userId,
        postId,
        req.body
      );

      res
        .status(STATUS_CODE.CREATED)
        .json(
          new ApiResponse(STATUS_CODE.CREATED, result, "Commented Success")
        );
    }
  );

  getPostComments = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { postId } = req.params;
      AppAssert(postId, STATUS_CODE.NOT_FOUND, "Post Id not given in params");

      const Comments = await interactionServices.getPostComments(postId);
      const Count = await interactionServices.getPostCommentsCount(postId);

      res
        .status(STATUS_CODE.SUCCESS)
        .json(
          new ApiResponse(
            STATUS_CODE.SUCCESS,
            { Comments, Count },
            "Post Comment and comments Count returned"
          )
        );
    }
  );

  updateComment = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "AUthentication Required");
      }

      const { commentId } = req.params;

      AppAssert(
        commentId,
        STATUS_CODE.NOT_FOUND,
        "Comment id not given in params"
      );

      const newComment = await interactionServices.updateComment(
        commentId,
        req.user.userId,
        req.body
      );

      res
        .status(STATUS_CODE.SUCCESS)
        .json(
          new ApiResponse(
            STATUS_CODE.SUCCESS,
            newComment,
            "Comment updated successfully"
          )
        );
    }
  );

  deleteComment = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "AUthentication Required");
      }

      const { commentId } = req.params;
      AppAssert(
        commentId,
        STATUS_CODE.NOT_FOUND,
        "Comment id not given in params"
      );

      const result = await interactionServices.deleteComment(
        commentId,
        req.user.userId
      );

      res
        .status(STATUS_CODE.SUCCESS)
        .json(
          new ApiResponse(
            STATUS_CODE.SUCCESS,
            result,
            "Comment updated successfully"
          )
        );
    }
  );

  // Likes
  likePost = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "AUthentication Required");
      }

      const { postId } = req.params;
      AppAssert(postId, STATUS_CODE.NOT_FOUND, "Post Id not given in params");

      const result = await interactionServices.likePost(
        req.user.userId,
        postId
      );

      res
        .status(STATUS_CODE.SUCCESS)
        .json(new ApiResponse(STATUS_CODE.SUCCESS, result, "Post liked"));
    }
  );
  unlikePost = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "AUthentication Required");
      }

      const { postId } = req.params;
      AppAssert(postId, STATUS_CODE.NOT_FOUND, "Post Id not given in params");

      const result = await interactionServices.unlikePost(
        req.user.userId,
        postId
      );
      res
        .status(STATUS_CODE.SUCCESS)
        .json(new ApiResponse(STATUS_CODE.SUCCESS, result, "Post UnLiked"));
    }
  );
  getPostLikes = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { postId } = req.params;
      AppAssert(postId, STATUS_CODE.NOT_FOUND, "Post Id not given in params");

      const Likes = await interactionServices.getPostLikes(postId);
      const likesCount = await interactionServices.getPostLikesCount(postId);

      res
        .status(STATUS_CODE.SUCCESS)
        .json(
          new ApiResponse(
            STATUS_CODE.SUCCESS,
            { Likes, likesCount },
            "Post Likes and Likes Count returned"
          )
        );
    }
  );
  checkUserLiked = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        res.status(200).json({
          success: true,
          data: { liked: false },
        });
        return;
      }

      const { postId } = req.params;
      AppAssert(postId, STATUS_CODE.NOT_FOUND, "Post Id not given in params");

      const hasLiked = await interactionServices.hasUserLikedPost(
        req.user.userId,
        postId
      );

      res
        .status(STATUS_CODE.SUCCESS)
        .json(new ApiResponse(STATUS_CODE.SUCCESS, hasLiked, "Success"));
    }
  );
  getUserLikedPosts = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "AUthentication Required");
      }

      const result = await interactionServices.getUserLikedPost(
        req.user.userId
      );

      res
        .status(STATUS_CODE.SUCCESS)
        .json(
          new ApiResponse(
            STATUS_CODE.SUCCESS,
            result,
            "Posts liked by user returned"
          )
        );
    }
  );
}

export const interactionController = new InteractionController();
