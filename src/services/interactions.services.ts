import {comments,likes,posts,usersTable,groupMembers} from '../db/postgres/schemas';
import { permissionService } from './permission.service';
import { notificationService } from './notification.service';
import { cacheService } from './redis_cache.service';
import type { CreateCommentInput,UpdateCommentInput } from '../utils/CommentSchemas/interactions';


export class InteractionServices{
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
  
  async createComment(userId : string,postId : string, input: CreateCommentInput){
    
  }

  async getPostComments(postId : string){

  }

  async getPostCommentsCount(postId : string){

  }

  async updateComment(commentId : string, userId : string, input : UpdateCommentInput){

  }

  async deleteComment(commentId : string, userId : string){

  }

  // Likes:

  async likePost(userId : string,postId : string){

  }
  async unlikePost(userId : string,postId : string){

  }
  async hasUserLikedPost(userId : string,postId : string):Promise<boolean>{

  }

  async getPostLikes(postId: string){

  }

  async getPostLikesCount(postId:string){

  }

  async getUserLikedPost(userId:string){

  }




}


export const interactionServices = new InteractionServices();
