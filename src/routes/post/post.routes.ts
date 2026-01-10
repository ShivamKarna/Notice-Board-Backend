import { Router } from 'express';
import { postController } from '../../controllers/post.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validation.middleware';
import { uploadMultiple,handleMulterError,uploadSingle } from '../../middlewares/upload.middleware';
import { z } from 'zod';
import { createPostSchema,updatePostSchema,rejectPostSchema } from '../../utils/PostSchemas/post.validation';

const postRouter = Router();

// protected routes
postRouter.post(
  '/',
  authenticate,
  validate(z.object({ body: createPostSchema })),
  postController.createPost
);

postRouter.post('/:postId/submit', authenticate, postController.submitPost);

postRouter.post('/:postId/approve', authenticate, postController.approvePost);

postRouter.post(
  '/:postId/reject',
  authenticate,
  validate(z.object({ body: rejectPostSchema })),
  postController.rejectPost
);

postRouter.patch(
  '/:postId',
  authenticate,
  validate(z.object({ body: updatePostSchema })),
  postController.updatePost
);

postRouter.delete('/:postId', authenticate, postController.deletePost);

postRouter.get('/:postId', postController.getPostById);

postRouter.get('/user/:userId', postController.getUserPosts);

postRouter.post(
  '/:postId/media',
  authenticate,
  uploadMultiple,
  handleMulterError,
  postController.uploadMedia
);

postRouter.delete('/:postId/media/:mediaId', authenticate, postController.removeMedia);

export {postRouter};



