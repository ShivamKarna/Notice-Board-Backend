import { postServices } from "../services/post.service";
import type {Request, Response, NextFunction} from 'express';
import { ApiError } from "../utils/ApiError";
import { AsyncHandler } from "../utils/AsyncHandler";
import { STATUS_CODE } from "../types/httpStatus";
import { ApiResponse } from "../utils/ApiResponse";
import { AppAssert } from "../utils/AppAssert";


export class PostController {

  createPost = AsyncHandler(
    async(req : Request, res : Response, next : NextFunction) =>{
      if(!req.user){
        throw new ApiError(STATUS_CODE.UNAUTHORIZED,"Authentication Required");
      }

      const post = await postServices.createPost(req.user.userId, req.body);

      if(!post){
        throw new ApiError(STATUS_CODE.INTERNAL_SERVER_ERROR,"Error while Creating Post");
      }


      res.status(STATUS_CODE.CREATED).json(new ApiResponse(STATUS_CODE.CREATED,post,"Post Creation Success"));
    }
  );

  submitPost = AsyncHandler(
    async(req : Request, res : Response, next : NextFunction) =>{
      if(!req.user){
        throw new ApiError(STATUS_CODE.UNAUTHORIZED,"Authentication Required");
      }

      const {postId} = req.params;

      AppAssert(postId,STATUS_CODE.NOT_FOUND,"Post with this id not found");

      const result = await postServices.submitForApproval(postId, req.user.userId);

      res.status(STATUS_CODE.SUCCESS).json(new ApiResponse(STATUS_CODE.SUCCESS,result,"Post submitted for approval"));
    }
  );

  approvePost =AsyncHandler(
    async(req : Request, res : Response, next : NextFunction) =>{
      if(!req.user){
        throw new ApiError(STATUS_CODE.UNAUTHORIZED,"Authentication Required");
      }

      const {postId} = req.params;

      AppAssert(postId,STATUS_CODE.NOT_FOUND,"Post with this id not found");

      const result = await postServices.approvePost(postId, req.user.userId);

      res.status(STATUS_CODE.SUCCESS).json(new ApiResponse(STATUS_CODE.SUCCESS,result,"Post approved"));
    }
  );

  rejectPost =AsyncHandler(
    async(req : Request, res : Response, next : NextFunction) =>{
      if(!req.user){
        throw new ApiError(STATUS_CODE.UNAUTHORIZED,"Authentication Required");
      }

      const {postId} = req.params;
      const {reason} = req.body;

      AppAssert(postId,STATUS_CODE.NOT_FOUND,"Post with this id not found");

      const result = await postServices.rejectPost(postId, req.user.userId,reason);

      res.status(STATUS_CODE.SUCCESS).json(new ApiResponse(STATUS_CODE.SUCCESS,result,`Post Rejected due to ${reason}`));
    }
  );
  updatePost = AsyncHandler (
    async(req : Request, res : Response, next : NextFunction) =>{
      if(!req.user){
        throw new ApiError(STATUS_CODE.UNAUTHORIZED,"Authentication Required");
      }

      const {postId} = req.params;

      AppAssert(postId,STATUS_CODE.NOT_FOUND,"Post with this id not found");

      const result = await postServices.updatePost(postId,req.user.userId,req.body);

      res.status(STATUS_CODE.SUCCESS).json(new ApiResponse(STATUS_CODE.SUCCESS,result,'Post updted successfully'));
    }
  );

  deletePost = AsyncHandler(
    async(req : Request, res : Response, next : NextFunction) =>{
      if(!req.user){
        throw new ApiError(STATUS_CODE.UNAUTHORIZED,"Authentication Required");
      }

      const {postId} = req.params;

      AppAssert(postId,STATUS_CODE.NOT_FOUND,"Post with this id not found");

      const result = await postServices.deletePost(postId,req.user.userId);

      res.status(STATUS_CODE.SUCCESS).json(new ApiResponse(STATUS_CODE.SUCCESS,result,'Post Deleted Successfully'));
    }
  );

  getPostById = AsyncHandler(
    async(req : Request, res : Response, next : NextFunction)=>{
      const {postId} = req.body;
      const userId = req.user?.userId;

      const post  = await postServices.getPostById(postId,userId);

      AppAssert(post,STATUS_CODE.BAD_REQUEST,"You don't have permission to view it");

      res.status(STATUS_CODE.SUCCESS).json(new ApiResponse(STATUS_CODE.SUCCESS,post,'Post with the given id served'));
    }
  );


  getGroupPosts = AsyncHandler(
    async(req : Request, res : Response, next : NextFunction) =>{
      const {groupId}= req.params;
      const {status} = req.query;


      const userId = req.user?.userId;

      if(!groupId){
        throw new ApiError(STATUS_CODE.NOT_FOUND,"GroupId not given in Params");
      }

      const result = await postServices.getGroupPosts(groupId,userId,status as string | undefined);

      res.status(STATUS_CODE.SUCCESS).json(new ApiResponse(STATUS_CODE.SUCCESS,result,"Posts of the group served"));
    }
  );

  getPendingPosts = AsyncHandler(
    async(req: Request, res : Response, next: NextFunction)=>{
      if(!req.user){
        throw new ApiError(STATUS_CODE.UNAUTHORIZED,"Authentication Required");
      }

      const {groupId} = req.params;
      if(!groupId){
        throw new ApiError(STATUS_CODE.NOT_FOUND,"GroupId not given in Params");
      }

      const post = await postServices.getPendingPosts(groupId, req.user.userId);

      res.status(STATUS_CODE.SUCCESS).json(new ApiResponse(STATUS_CODE.SUCCESS,post,"Pending Posts of the group served"));
    }
  );

  getUserPosts = AsyncHandler(
    async(req: Request,res : Response, next : NextFunction)=>{
      const {userId } = req.params;

      AppAssert(userId,STATUS_CODE.BAD_REQUEST,"UserId not given in params");

      const requesterId = req.user?.userId;

      const userPosts = await postServices.getUserPosts(userId,requesterId);

      res.status(STATUS_CODE.SUCCESS).json(new ApiResponse(STATUS_CODE.SUCCESS,userPosts,"User posts served"));
    }
  );

  uploadMedia = AsyncHandler(
    async(req : Request,res : Response, next :NextFunction)=>{
      if(!req.user){
        throw new ApiError(STATUS_CODE.UNAUTHORIZED,"Authentication Requird");
      }

      if(!req.files || !Array.isArray(req.files) || req.files.length ===0){
        throw new ApiError(STATUS_CODE.NOT_FOUND,"No Images Uploaded");
      }

      const { postId } = req.params;
      if(!postId){
        throw new ApiError(STATUS_CODE.NOT_FOUND,"Post ID not given in Params");
      }


      const files = req.files as Express.Multer.File[];

      const mediaUrls = files.map((file)=>file.path);

      const addedMedia = await postServices.addMediaToPost(postId, req.user?.userId, mediaUrls);
      

      res.status(STATUS_CODE.SUCCESS).json(new ApiResponse(STATUS_CODE.SUCCESS,addedMedia,"Media uploaded successfully"));

    }
  );

  removeMedia = AsyncHandler(
    async(req : Request, res : Response, next : NextFunction)=>{
      const { postId,mediaId }= req.params;


      const userId = req.user?.userId;

      AppAssert(userId,STATUS_CODE.UNAUTHORIZED,"Authentication Required");
      AppAssert(postId,STATUS_CODE.NOT_FOUND,"Post Id not provided");
      AppAssert(mediaId,STATUS_CODE.NOT_FOUND,"MediaId Id not provided");


      const result = await postServices.removeMediaFromPost(postId, mediaId, userId);
      res.status(STATUS_CODE.SUCCESS).json(new ApiResponse(STATUS_CODE.SUCCESS,result,"Media removed from post"));
    }
  );


}

export const postController = new PostController();
