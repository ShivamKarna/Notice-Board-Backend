import { groupLikesService } from "../services/groupsLikes.service";
import type { Request, Response, NextFunction} from 'express';
import { AsyncHandler } from "../utils/AsyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { STATUS_CODE } from "../types/httpStatus";
import { AppAssert } from "../utils/AppAssert";
import { ApiError } from "../utils/ApiError";
import { SingleStoreDriverTransaction } from "drizzle-orm/singlestore";


export class GroupLikesController{
  likeGroup = AsyncHandler(
    async(req : Request, res : Response, next : NextFunction)=>{

      if(!req.user){
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Authentication required");
      }

      const {groupId}= req.params;

      AppAssert(groupId, STATUS_CODE.NOT_FOUND, " Group Id not given in params");

      const result = await groupLikesService.likeGroup(req.user.userId, groupId);

      res.status(STATUS_CODE.SUCCESS).json(new ApiResponse(STATUS_CODE.SUCCESS , result, "Group Liked"));

    }
  );
  unlikeGroup = AsyncHandler(
    async(req : Request, res : Response, next : NextFunction)=>{
      if(!req.user){
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Authentication required");
      }

      const {groupId}= req.params;

      AppAssert(groupId, STATUS_CODE.NOT_FOUND, " Group Id not given in params");

      const result = await groupLikesService.unlikeGroup(req.user.userId, groupId);

      res.status(STATUS_CODE.SUCCESS).json(new ApiResponse(STATUS_CODE.SUCCESS , result, "Group Unliked"));
    }
  );

  hasUserLiked = AsyncHandler(
    async(req : Request, res : Response, next : NextFunction)=>{
      if (!req.user) {
         res.status(200).json({
          success: true,
          data: { favorited: false },
        });
        return;
      }

      const {groupId} = req.params;
      AppAssert(groupId, STATUS_CODE.NOT_FOUND, " Group Id not given in params");

      const result = await groupLikesService.hasUserLikedGroup(req.user.userId, groupId);

      res.status(STATUS_CODE.SUCCESS).json(new ApiResponse(STATUS_CODE.SUCCESS, result));
    }
  );

  getUserFavouriteGroup = AsyncHandler(
    async(req : Request, res : Response, next : NextFunction)=>{

      if(!req.user){
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Authentication Required");
      }
      const result = await groupLikesService.getUserFavoriteGroups(req.user.userId);

      res.status(STATUS_CODE.SUCCESS).json(new ApiResponse(STATUS_CODE.SUCCESS,result, "Users favorited groups served"));
    }
  );



  getGroupFavouriteCount = AsyncHandler(
    async(req : Request, res : Response, next : NextFunction)=>{

      if(!req.user){
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Authentication Required");
      }

      const {groupId } = req.params;
      if(!groupId) { 
        throw new ApiError(STATUS_CODE.NOT_FOUND, "Group Id not given in params");
      }
      const result = await groupLikesService.getGroupFavoritesCount(groupId);

      res.status(STATUS_CODE.SUCCESS).json(new ApiResponse(STATUS_CODE.SUCCESS,result, "Users favorited groups Count served"));
    }
  );

}

export const groupLikesController = new GroupLikesController();
