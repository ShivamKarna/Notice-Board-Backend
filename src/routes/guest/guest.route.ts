import {Router} from 'express';
import { guestController } from '../../controllers/guest.controller';
import { ensureGuestSession } from '../../middlewares/guest.middleware';

const guestRouter =  Router();


guestRouter.use(ensureGuestSession);



guestRouter.get('/groups', guestController.getPublicGroups);

guestRouter.get('/groups/trending', guestController.getTrendingGroups);

guestRouter.get('/groups/:groupId', guestController.getGroupDetails);

guestRouter.get('/groups/:groupId/posts', guestController.getGroupPublicPosts);

guestRouter.get('/posts/:postId', guestController.getPublicPost);

guestRouter.get('/feed', guestController.getPublicFeed);

guestRouter.get('/posts/trending', guestController.getTrendingPosts);

export {guestRouter};
