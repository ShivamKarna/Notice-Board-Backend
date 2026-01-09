import type { Request, Response, NextFunction } from "express";
import { groupService } from "../services/group.service.ts";
import { permissionService } from "../services/permission.service";
import { ApiError } from "../utils/ApiError.ts";
import { AsyncHandler } from "../utils/AsyncHandler";
import { AppAssert } from "../utils/AppAssert";
import { STATUS_CODE } from "../types/httpStatus.ts";
import { ApiResponse } from "../utils/ApiResponse.ts";
// Functions in the controller
// createGroup
//getUserGroups
//getPublicGroups
// getGroupById
//getGroupMember
//updateGroup
//deleteGroup
//inviteMember
//acceptInvitation
//getUserInvitations
//declineInvitation
// removeMember
export class GroupController {
  createGroup = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Authentication required");
      }

      const group = await groupService.createGroup(req.user.userId, req.body);

      res
        .status(STATUS_CODE.CREATED)
        .json(
          new ApiResponse(
            STATUS_CODE.CREATED,
            group,
            "Group created Successfully"
          )
        );
    }
  );

  getUserGroups = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Authentication required");
      }
      const userGroups = await groupService.getUserGroups(req.user.userId);

      res
        .status(STATUS_CODE.SUCCESS)
        .json(
          new ApiResponse(
            STATUS_CODE.SUCCESS,
            userGroups,
            "The group's in which the given user is present is returned"
          )
        );
    }
  );

  getPublicGroups = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user?.userId;

      const publicGroups = await groupService.getNotJoinedGroups(userId);

      res
        .status(STATUS_CODE.SUCCESS)
        .json(
          new ApiResponse(
            STATUS_CODE.SUCCESS,
            publicGroups,
            "Groups that user are not in Returned"
          )
        );
    }
  );

  getGroupById = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { groupId } = req.params;
      const userId = req.user?.userId;

      if (!groupId) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Group Id not provided");
      }
      const group = await groupService.getGroupById(groupId, userId);

      if (!group) {
        throw new ApiError(
          STATUS_CODE.UNAUTHORIZED,
          "Authentication required, Group not found"
        );
      }

      res
        .status(STATUS_CODE.SUCCESS)
        .json(
          new ApiResponse(
            STATUS_CODE.SUCCESS,
            group,
            "Group with this ID returned"
          )
        );
    }
  );

  getGroupMember = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { groupId } = req.params;

      AppAssert(groupId, STATUS_CODE.NOT_FOUND, "Group with this id not found");
      if (req.user) {
        const isMember = await permissionService.isMember(
          req.user.userId,
          groupId
        );
        if (!isMember) {
          throw new ApiError(
            STATUS_CODE.FORBIDDEN,
            "You must be a member of this Group"
          );
        }
      }
      const userId = req.user?.userId;
      if (!userId) {
        throw new ApiError(
          STATUS_CODE.NOT_FOUND,
          "User with this Id not found"
        );
      }
      const members = await groupService.getGroupMembers(userId, groupId);
      res
        .status(STATUS_CODE.SUCCESS)
        .json(
          new ApiResponse(
            STATUS_CODE.SUCCESS,
            members,
            "Group members returned"
          )
        );
    }
  );

  updateGroup = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Authentication Required");
      }

      const { groupId } = req.params;

      AppAssert(
        groupId,
        STATUS_CODE.NOT_FOUND,
        "Group with this user id not found"
      );

      const updatedGroup = await groupService.updateGroup(
        groupId,
        req.user?.userId,
        req.body
      );

      res
        .status(STATUS_CODE.SUCCESS)
        .json(
          new ApiResponse(STATUS_CODE.SUCCESS, updatedGroup, "Group Updated")
        );
    }
  );

  deleteGroup = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Authentication Required");
      }
      const { groupId } = req.params;
      AppAssert(groupId, STATUS_CODE.NOT_FOUND, "Group with this id not found");

      await groupService.deleteGroup(groupId, req.user.userId);

      res
        .status(STATUS_CODE.SUCCESS)
        .json(
          new ApiResponse(STATUS_CODE.SUCCESS, {}, "Group deleted Successfully")
        );
    }
  );

  inviteMember = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Authentication required");
      }

      const { groupId } = req.params;
      AppAssert(
        groupId,
        STATUS_CODE.NOT_FOUND,
        "Group with this id doesn't exist"
      );
      const { inviteeEmail, roleId } = req.body;

      const result = await groupService.inviteUserToGroup(
        groupId,
        req.user.userId,
        inviteeEmail,
        roleId
      );

      res
        .status(STATUS_CODE.SUCCESS)
        .json(
          new ApiResponse(STATUS_CODE.SUCCESS, result, "User Invitation Sent")
        );
    }
  );

  acceptInvitation = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Authentication Required");
      }

      const { token } = req.params;
      if (!token) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Token not provided");
      }

      const result = await groupService.acceptinvitation(
        token,
        req.user?.userId
      );

      res
        .status(STATUS_CODE.SUCCESS)
        .json(
          new ApiResponse(STATUS_CODE.SUCCESS, result, "Invitation Accepted")
        );
    }
  );

  declineInvitation = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Authentication Required");
      }

      const { token } = req.params;
      if (!token) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Token not provided");
      }

      const result = await groupService.declineInvitation(
        token,
        req.user?.userId
      );

      res
        .status(STATUS_CODE.SUCCESS)
        .json(
          new ApiResponse(STATUS_CODE.SUCCESS, result, "Invitation Declined")
        );
    }
  );

  getUserInvitations = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Authentication Required");
      }

      const result = await groupService.getuserinvitations(req.user.userId);

      res
        .status(STATUS_CODE.SUCCESS)
        .json(
          new ApiResponse(
            STATUS_CODE.SUCCESS,
            result,
            "User Invitations served"
          )
        );
    }
  );

  removeMember = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Authentication Required");
      }

      const userWhoIsRemoving = req.user.userId;
      const { userWhoisBeingRemoved, groupId } = req.body;

      const result = await groupService.removeMember(
        groupId,
        userWhoIsRemoving,
        userWhoIsRemoving
      );

      res
        .status(STATUS_CODE.SUCCESS)
        .json(
          new ApiResponse(
            STATUS_CODE.SUCCESS,
            result,
            "User removed from Group"
          )
        );
    }
  );

  leaveGroup = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ApiError(STATUS_CODE.UNAUTHORIZED, "Authentication Required");
      }
      const { groupId } = req.params;

      AppAssert(groupId, STATUS_CODE.NOT_FOUND, "Group with this id not found");
      const result = await groupService.leaveGroup(groupId, req.user?.userId);

      res
        .status(STATUS_CODE.SUCCESS)
        .json(new ApiResponse(STATUS_CODE.SUCCESS, result, "Group Leaved"));
    }
  );

  updateMemberRole = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new ApiError(401, "Authentication required");
      }

      const { groupId, memberId } = req.params;

      const { roleId } = req.body;
      AppAssert(
        memberId,
        STATUS_CODE.NOT_FOUND,
        "Member with this id not found"
      );
      AppAssert(roleId, STATUS_CODE.NOT_FOUND, "Role with this id not found");
      AppAssert(groupId, STATUS_CODE.NOT_FOUND, "Group with this id not found");
      const result = await groupService.updateMemberRole(
        groupId,
        req.user?.userId,
        memberId,
        roleId
      );

      res
        .status(STATUS_CODE.SUCCESS)
        .json(
          new ApiResponse(
            STATUS_CODE.SUCCESS,
            result,
            "Member role updated successfully"
          )
        );
    }
  );
}

export const groupController = new GroupController();
