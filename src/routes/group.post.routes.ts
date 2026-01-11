import { Router } from "express";
import { postController } from "../controllers/post.controller";
import { authenticate } from "../middlewares/auth.middleware";

const groupPostRouter = Router({mergeParams: true});

groupPostRouter.get('/', postController.getGroupPosts);

groupPostRouter.get('/pending', authenticate, postController.getPendingPosts);

export  {groupPostRouter};
