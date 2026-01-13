import {Router} from 'express';
import { interactionController } from '../../controllers/interactions.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { createCommentSchema, updateCommentSchema } from '../../utils/CommentSchemas/interactions';
import {z} from 'zod';


const interactionsRouter = Router();


// Comments Routes
interactionsRouter.post('/posts/:postId/comments',authenticate, validate(z.object({body: createCommentSchema})),interactionController.createComment);

interactionsRouter.get('/posts/:postId/comments',interactionController.getPostComments);

interactionsRouter.patch(
  '/comments/:commentId',
  authenticate,
  validate(z.object({ body: updateCommentSchema })),
  interactionController.updateComment
);

interactionsRouter.delete('/comments/:commentId', authenticate, interactionController.deleteComment);


// Likes Routes
interactionsRouter.post('/posts/:postId/like', authenticate, interactionController.likePost);

interactionsRouter.delete('/posts/:postId/like', authenticate, interactionController.unlikePost);

interactionsRouter.get('/posts/:postId/likes', interactionController.getPostLikes);

interactionsRouter.get('/posts/:postId/liked', interactionController.checkUserLiked);

interactionsRouter.get('/users/me/liked-posts', authenticate, interactionController.getUserLikedPosts);

export {interactionsRouter};


