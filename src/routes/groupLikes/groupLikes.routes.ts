import { groupLikesController } from "../../controllers/groupLikes.controller";
import {Router} from 'express';
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { createGroupSchema,updateGroupSchema, updateMemberRoleSchema, inviteMemberSchema } from "../../utils/GroupSchemas/group";
import {z} from 'zod';
import { groupController } from "../../controllers/group.controller";
import { groupPostRouter } from "../group.post.routes";


const groupLikeRouter = Router();


groupLikeRouter.post(
  '/',
  authenticate,
  validate(z.object({ body: createGroupSchema })),
  groupController.createGroup
);

groupLikeRouter.get('/my-groups', authenticate, groupController.getUserGroups);

groupLikeRouter.get('/favorites', authenticate, groupLikesController.getUserFavouriteGroup);

groupLikeRouter.get('/public', groupController.getPublicGroups);

groupLikeRouter.get('/invitations', authenticate, groupController.getUserInvitations);

groupLikeRouter.post('/invitations/:token/accept', authenticate, groupController.acceptInvitation);

groupLikeRouter.post('/invitations/:token/decline', authenticate, groupController.declineInvitation);

groupLikeRouter.get('/:groupId', groupController.getGroupById);

groupLikeRouter.get('/:groupId/members', authenticate, groupController.getGroupMember);

groupLikeRouter.get('/:groupId/favorites/count', groupLikesController.getGroupFavouriteCount);

groupLikeRouter.get('/:groupId/favorited',groupLikesController.hasUserLiked);

groupLikeRouter.post('/:groupId/favorite', authenticate, groupLikesController.likeGroup);

groupLikeRouter.delete('/:groupId/favorite', authenticate, groupLikesController.unlikeGroup);

groupLikeRouter.patch(
  '/:groupId',
  authenticate,
  validate(z.object({ body: updateGroupSchema })),
  groupController.updateGroup
);

groupLikeRouter.delete('/:groupId', authenticate, groupController.deleteGroup);

groupLikeRouter.post(
  '/:groupId/members/invite',
  authenticate,
  validate(z.object({ body: inviteMemberSchema })),
  groupController.inviteMember
);
groupLikeRouter.delete(
  '/:groupId/members/:memberId',
  authenticate,
  groupController.removeMember
);

groupLikeRouter.post('/:groupId/leave', authenticate, groupController.leaveGroup);

groupLikeRouter.patch(
  '/:groupId/members/:memberId/role',
  authenticate,
  validate(z.object({ body: updateMemberRoleSchema })),
  groupController.updateMemberRole
);

groupLikeRouter.use('/:groupId/posts', groupPostRouter);


export {groupLikeRouter};
