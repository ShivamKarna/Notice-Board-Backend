import type {Request, Response, NextFunction} from 'express'
import { guestService } from '../services/guest.service'
import { AsyncHandler } from '../utils/AsyncHandler'
import { ApiError } from '../utils/ApiError'
import { ApiResponse } from '../utils/ApiResponse'
import { STATUS_CODE } from '../types/httpStatus'
import { AppAssert } from '../utils/AppAssert'
import { AwsPgDialect } from 'drizzle-orm/aws-data-api/pg'
import { parse } from 'zod'

export class GuestController { 
  getPublicGroups = AsyncHandler(
    async(req : Request, res : Response, next  : NextFunction)=>{
      const page = parseInt(req.params.page as string) || 1;
      const limit = parseInt(req.params.limit as string) || 20;
      
      const result = await guestService.getPublicGroups(page, limit);

      // track guest activity
      if(req.sessionToken){
        await guestService.trackGuestActivity(req.sessionToken, 'view_public_groups');
      }

      res.status(STATUS_CODE.SUCCESS).json(new ApiResponse(STATUS_CODE.SUCCESS,result, 'Public groups served'));
    }
  );
  getGroupDetails = AsyncHandler(
    async(req : Request, res : Response, next  : NextFunction)=>{
      const { groupId } = req.params;

      AppAssert(groupId, STATUS_CODE.NOT_FOUND, "Group id not given in params");
      const group = await guestService.getGroupDetails(groupId);

      AppAssert(group, STATUS_CODE.NOT_FOUND, "Group Not Found");

      if (req.sessionToken) {
        await guestService.trackGuestActivity(req.sessionToken, 'view_group', groupId);
      }

      res.status(STATUS_CODE.SUCCESS).json(new ApiResponse(STATUS_CODE.SUCCESS, group, "Group details served"));
    }
  );
  getGroupPublicPosts = AsyncHandler(
    async(req : Request, res : Response, next  : NextFunction)=>{
      const { groupId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      AppAssert(groupId, STATUS_CODE.NOT_FOUND, "Group id not given in params");
      const result = await guestService.getGroupPublicPosts(groupId, page, limit);

      if (req.sessionToken) {
        await guestService.trackGuestActivity(req.sessionToken, 'view_group_posts', groupId);
      }

      res.status(STATUS_CODE.SUCCESS).json(new ApiResponse(STATUS_CODE.SUCCESS, result, "Group public posts served"));
    }

  );
  getPublicPost = AsyncHandler(
    async(req : Request, res : Response, next  : NextFunction)=>{
      const {postId} = req.params;
      AppAssert(postId, STATUS_CODE.NOT_FOUND, "Post id not given in params");

      const post = await guestService.getPublicPost(postId);

      AppAssert(post, STATUS_CODE.NOT_FOUND, "Post not found or does not exist");

      if (req.sessionToken) {
        await guestService.trackGuestActivity(req.sessionToken, 'view_post', postId);
      }

      res.status(STATUS_CODE.SUCCESS).json(new ApiResponse(STATUS_CODE.SUCCESS, post, "Post served"));
    }
  );
  getPublicFeed = AsyncHandler(
    async(req : Request, res : Response, next  : NextFunction)=>{

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result= await guestService.getPublicFeed(page, limit);

      if(req.sessionToken){
        await guestService.trackGuestActivity(req.sessionToken, 'view_public_feed');
      }

      res.status(STATUS_CODE.SUCCESS).json(new ApiResponse(STATUS_CODE.SUCCESS, result, "Public Feed served"));
    }
  );
  getTrendingGroups = AsyncHandler(
    async(req : Request, res : Response, next  : NextFunction)=>{
      const limit = parseInt(req.query.limit as string) || 10;

      const groups = await guestService.getTrendingGroups(limit);
      res.status(STATUS_CODE.SUCCESS).json(new ApiResponse(STATUS_CODE.SUCCESS, groups, "Trending Groups Served"));
    }
  );
  getTrendingPosts = AsyncHandler(
    async(req : Request, res : Response, next  : NextFunction)=>{

      const limit = parseInt(req.query.limit as string) || 10;

      const posts = await guestService.getTrendingPosts(limit);

      res.status(STATUS_CODE.SUCCESS).json(new ApiResponse(STATUS_CODE.SUCCESS, posts, "Trending Posts Served"));
    }
  );
  promptSignIn = AsyncHandler(
    async(req : Request, res : Response, next  : NextFunction)=>{
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please sign in to perform this action',
        action: 'sign_in_required',
      });
    }
  );


  // this is the main closing bracket
}

export const guestController = new GuestController();
