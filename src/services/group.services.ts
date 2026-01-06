import crypto from "crypto";
import { and, desc, eq, notInArray } from "drizzle-orm";
import { db } from "../db/postgres/db.postgres";
import {
  groupMembers,
  groups,
  invitations,
  roles,
  usersTable,
} from "../db/postgres/schemas";
import { STATUS_CODE } from "../types/httpStatus";
import { ApiError } from "../utils/ApiError";
import {
  type CreateGroupInput,
  type UpdateGroupInput,
} from "../utils/GroupSchemas/group";
import { permissionService } from "./permission.service";
import { AppAssert } from "../utils/AppAssert";
import { CORS_ORIGIN } from "../utils/env";
import { _success } from "zod/v4/core";

export class GroupService {
  // TODO:: implement these functions

  // createGroup
  async createGroup(userId: string, input: CreateGroupInput) {
    const [group] = await db
      .insert(groups)
      .values({
        name: input.name,
        description: input.description,
        avatarImage: input.avatarUrl,
        bannerImage: input.bannerUrl,
        requiresApproval: input.requiresApproval,
        ownerId: userId,
      })
      .returning();

    if (!group) {
      throw new ApiError(
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        "Failed to create group"
      );
    }

    const ownerRole = await permissionService.getRoleByName("Owner");
    if (!ownerRole || ownerRole.length === 0) {
      throw new ApiError(
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        "Owner role not found. Please seed RBAC data."
      );
    }

    // add creator as owner of group
    await db.insert(groupMembers).values({
      groupId: group.id,
      userId,
      roleId: ownerRole[0]!.id,
      canPost: true,
      canComment: true,
      isActive: true,
    });

    return group;
  }
  // getUserGroups
  async getUserGroups(userid: string) {
    const usergroups = await db
      .select({
        group: groups,
        role: {
          id: roles.id,
          name: roles.name,
          level: roles.level,
        },
        membership: {
          joinedat: groupMembers.joinedAt,
          canpost: groupMembers.canPost,
          cancomment: groupMembers.canComment,
        },
      })
      .from(groupMembers)
      .innerJoin(groups, eq(groupMembers.groupId, groups.id))
      .innerJoin(roles, eq(groupMembers.roleId, roles.id))
      .where(
        and(eq(groupMembers.userId, userid), eq(groupMembers.isActive, true))
      )
      .orderBy(desc(groupMembers.joinedAt));

    return usergroups;
  }
  // getNotJoinedGroups
  async getNotJoinedGroups(userId?: string) {
    // if user id given then exclude the groups that user is in
    let excludeGroupIds: string[] = [];
    if (userId) {
      const userGroupIds = await db
        .select({
          groupId: groupMembers.groupId,
        })
        .from(groupMembers)
        .where(
          and(eq(groupMembers.userId, userId), eq(groupMembers.isActive, true))
        );

      excludeGroupIds = userGroupIds.map((g) => g.groupId);
    }

    const query = db
      .select({
        group: groups,
        owner: {
          id: usersTable.id,
          username: usersTable.username,
        },
        membercount: db.$count(
          groupMembers,
          eq(groupMembers.groupId, groups.id)
        ),
      })
      .from(groups)
      .innerJoin(usersTable, eq(groups.ownerId, usersTable.id))
      .where(
        excludeGroupIds.length > 0
          ? notInArray(groups.id, excludeGroupIds)
          : undefined
      );

    return await query;
  }
  // getGroupById
  async getGroupById(groupId: string, userId?: string) {
    const [group] = await db
      .select({
        group: groups,
        owner: {
          id: usersTable.id,
          username: usersTable.username,
          email: usersTable.email,
        },
      })
      .from(groups)
      .innerJoin(usersTable, eq(groups.ownerId, usersTable.id))
      .where(eq(groups.id, groupId))
      .limit(1);

    if (!group) {
      return null;
    }

    const memberCount = await db
      .select({ count: db.$count(groupMembers) })
      .from(groupMembers)
      .where(
        and(eq(groupMembers.groupId, groupId), eq(groupMembers.isActive, true))
      );

    let userRole = null;
    let userPermissions: string[] = [];

    if (userId) {
      userRole = await permissionService.getUserRole(userId, groupId);
      if (userRole) {
        userPermissions = await permissionService.getUserPermissions(
          userId,
          groupId
        );
      }
    }
  }
  // getgroupMembers
  async getGroupMembers(userId: string, groupId: string) {
    const memebers = await db
      .select({
        member: {
          id: groupMembers.id,
          joinedAt: groupMembers.joinedAt,
          canPost: groupMembers.canPost,
          canComment: groupMembers.canComment,
        },
        userDetails: {
          id: usersTable.id,
          name: usersTable.username,
          email: usersTable.email,
        },
        role: {
          id: roles.id,
          name: roles.name,
          level: roles.level,
        },
      })
      .from(groupMembers)
      .innerJoin(usersTable, eq(groupMembers.userId, usersTable.id))
      .innerJoin(roles, eq(groupMembers.roleId, roles.id))
      .where(
        and(eq(groupMembers.groupId, groupId), eq(groupMembers.isActive, true))
      )
      .orderBy(desc(roles.level), desc(groupMembers.joinedAt));

    return memebers;
  }
  // updategroup
  async updateGroup(groupId: string, userId: string, input: UpdateGroupInput) {
    const isOwnerOrAdmin = await permissionService.isOwnerOrAdmin(
      userId,
      groupId
    );

    if (isOwnerOrAdmin) {
      throw new ApiError(
        STATUS_CODE.UNAUTHORIZED,
        "Only Owner or Admin can update Group Info's"
      );
    }

    const [updatedGroup] = await db
      .update(groups)
      .set({
        ...input,
      })
      .where(eq(groups.id, groupId))
      .returning();

    return updatedGroup;
  }
  // deleteGroup
  async deleteGroup(
    groupId: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    const isOwner = await permissionService.isOwner(userId, groupId);

    if (!isOwner) {
      throw new ApiError(
        STATUS_CODE.UNAUTHORIZED,
        "Only Owners can delete Group"
      );
    }

    await db.delete(groups).where(eq(groups.id, groupId));

    return { success: true, message: "Group Deleted Successfully" };
  }
  //inviteUserToGroup
  async inviteUserToGroup(
    groupId: string,
    inviterId: string,
    inviteeEmail: string,
    roleId: string
  ) {
    // check if intiter has permission
    // find invitee by email
    // check if invitee is already member of group
    // check if invitee already has a pending invitation
    // check if role exists and is valid
    // check if the role invitee is being  invited it's not Owner
    // now generate the invitation token
    // set expiration of token
    // create invitation
    // create notification for invitee

    const hasPermission = await permissionService.hasPermission(
      inviterId,
      groupId,
      "user:invite"
    );

    if (!hasPermission) {
      throw new ApiError(
        STATUS_CODE.UNAUTHORIZED,
        "You do not have permission to invite user"
      );
    }

    const [invitee] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, inviteeEmail))
      .limit(1);

    AppAssert(invitee, STATUS_CODE.NOT_FOUND, "User with this email not found");

    const alreadyMemberOfGroup = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, invitee.id),
          eq(groupMembers.isActive, true)
        )
      )
      .limit(1);

    if (alreadyMemberOfGroup.length > 0) {
      throw new ApiError(
        STATUS_CODE.CONFLICT,
        "The user who is being invited is alrady member of the group"
      );
    }

    const alreadyPendingInvitation = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.groupId, groupId),
          eq(invitations.inviteeId, invitee.id),
          eq(invitations.status, "pending")
        )
      )
      .limit(1);

    if (alreadyPendingInvitation) {
      throw new ApiError(
        STATUS_CODE.CONFLICT,
        "User already has a pending invitation to the Group"
      );
    }

    const roleUserIsBeingInvitedTo = await permissionService.getRoleById(
      roleId
    );

    if (!roleUserIsBeingInvitedTo) {
      throw new ApiError(STATUS_CODE.BAD_REQUEST, "Invalid role");
    }

    if (roleUserIsBeingInvitedTo[0]?.name === "Owner") {
      throw new ApiError(
        STATUS_CODE.BAD_REQUEST,
        "User can't be invited as Owner"
      );
    }

    const token = crypto.randomBytes(32).toString("hex");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const [invitation] = await db
      .insert(invitations)
      .values({
        groupId,
        inviterId,
        inviteeId: invitee.id,
        roleId: roleId,
        token,
        status: "pending",
        expiresAt,
      })
      .returning();

    AppAssert(
      invitation,
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      "Error while creating Invitation"
    );

    const [group] = await db
      .select()
      .from(groups)
      .where(eq(groups.id, groupId));
    const [inviter] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, invitee.id));

    AppAssert(group, STATUS_CODE.INTERNAL_SERVER_ERROR, "Group doesn't exist");
    AppAssert(
      inviter,
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      "Inviter doesn't exist"
    );

    await notificationService.createNotification({   //TODO: notificationServices bnaba baki xai 
      userId: invitee.id,
      type: "group_invite",
      relatedEntityType: "invitation",
      relatedEntityId: invitation.id,
      message: `${inviter.username} invited you to join ${group.name} roles ${roles}`,
    });

    return {
      invitation,
      invitationLink: `${CORS_ORIGIN}/invitations/${token}`,
    };
  }
  // acceptinvitation
  async acceptinvitation(token: string, userId: string) {
    // find invitation
    // check if invitation is for user
    // add user to group
    // update status
    // get group details
    // return response with success , message and group info
    const [invitation] = await db
      .select()
      .from(invitations)
      .where(eq(invitations.token, token));

    AppAssert(invitations, STATUS_CODE.BAD_REQUEST, "Invalid token");

    if (invitation?.inviteeId !== userId) {
      throw new ApiError(
        STATUS_CODE.BAD_REQUEST,
        "This invitation is not for you"
      );
    }

    if (invitation.status !== "pending") {
      throw new ApiError(
        STATUS_CODE.CONFLICT,
        `The Invitation has already been ${invitation.status}`
      );
    }

    if (new Date() > invitation.expiresAt) {
      throw new ApiError(
        STATUS_CODE.BAD_REQUEST,
        "Invitation has been expired"
      );
    }

    await db.insert(groupMembers).values({
      groupId: invitation.groupId,
      userId,
      roleId: invitation.roleId,
      canPost: true,
      canComment: true,
      isActive: true,
    });

    await db
      .update(invitations)
      .set({
        status: "accepted",
      })
      .where(eq(invitations.id, invitation.id));

    const [group] = await db
      .select()
      .from(groups)
      .where(eq(groups.id, invitation.groupId));

    AppAssert(group, STATUS_CODE.INTERNAL_SERVER_ERROR, "Group doesn't exist");

    return {
      success: true,
      message: `Successsfully joined ${group.name}`,
      group,
    };
  }

  // declineinvitation
  async declineinvitation(token: string, userId: string) {
    const [proposedInvitation] = await db
      .select()
      .from(invitations)
      .where(eq(invitations.token, token))
      .limit(1);
    if (!proposedInvitation) {
      throw new ApiError(STATUS_CODE.BAD_REQUEST, "Invalid token");
    }
    if (proposedInvitation.inviteeId !== userId) {
      throw new ApiError(
        STATUS_CODE.BAD_REQUEST,
        "This invitation is not for you"
      );
    }

    if (proposedInvitation.status !== "pending") {
      throw new ApiError(
        STATUS_CODE.BAD_REQUEST,
        `Invitatin already has been ${proposedInvitation.status}`
      );
    }

    if (new Date() > proposedInvitation.expiresAt) {
      throw new ApiError(STATUS_CODE.BAD_REQUEST, "Invalid invitation");
    }

    await db
      .update(invitations)
      .set({
        status: "declined",
      })
      .where(eq(invitations.id, proposedInvitation.id));

    return {
      success: true,
      message: "Invitation Declined",
    };
  }
  // removeMember
  async removeMember(
    groupId: string,
    IdOfUserWhoIsRemoving: string,
    IdOfMemberWhoIsBeingRemoved: string
  ) {
    const hasPermission = await permissionService.hasPermission(
      IdOfUserWhoIsRemoving,
      groupId,
      "user:remove"
    );

    if (!hasPermission) {
      throw new ApiError(
        STATUS_CODE.UNAUTHORIZED,
        "You don't have persmission to remove"
      );
    }

    if (IdOfUserWhoIsRemoving === IdOfMemberWhoIsBeingRemoved) {
      throw new ApiError(
        STATUS_CODE.UNAUTHORIZED,
        "You can't remove yourself from the Group"
      );
    }

    const memberRole = await permissionService.getUserRole(
      IdOfMemberWhoIsBeingRemoved,
      groupId
    );

    if (memberRole?.roleName === "Owner") {
      throw new ApiError(
        STATUS_CODE.UNAUTHORIZED,
        "You can't remove Owner from the group"
      );
    }

    await db
      .update(groupMembers)
      .set({
        isActive: false,
      })
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, IdOfMemberWhoIsBeingRemoved)
        )
      );

    return {
      success: true,
      message: "User removed successfully",
    };
  }
  // leavegroup
  async leaveGroup(groupId: string, userId: string) {
    // Check if user is a member
    // Check if user is owner
    // Soft delete
    const isOwner = await permissionService.isOwner(userId, groupId);

    if (isOwner) {
      throw new Error(
        "Group owner cannot leave. Please transfer ownership or delete the group."
      );
    }

    const isMember = await permissionService.isMember(userId, groupId);

    if (!isMember) {
      throw new Error("You are not a member of this group");
    }

    await db
      .update(groupMembers)
      .set({ isActive: false })
      .where(
        and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId))
      );

    return {
      success: true,
      message: "Successfully left the group",
    };
  }
  // updatememberrole
  async updateMemberRole(
    groupId: string,
    userId: string,
    memberIdToUpdate: string,
    newRoleId: string
  ) {
    // Check if user has permission
    const hasPermission = await permissionService.hasPermission(
      userId,
      groupId,
      "user:promote"
    );

    if (!hasPermission) {
      throw new Error("You do not have permission to change member roles");
    }

    // Cannot change your own role
    if (userId === memberIdToUpdate) {
      throw new Error("Cannot change your own role");
    }

    // Get new role
    const [newRole] = await permissionService.getRoleById(newRoleId);
    if (!newRole) {
      throw new Error("Invalid role");
    }

    // Cannot assign Owner role
    if (newRole.name === "Owner") {
      throw new Error(
        "Cannot assign Owner role. Use transfer ownership instead."
      );
    }

    // Cannot change owner's role
    const memberRole = await permissionService.getUserRole(
      memberIdToUpdate,
      groupId
    );
    if (memberRole?.roleName === "Owner") {
      throw new Error("Cannot change the owner's role");
    }

    // Update role
    await db
      .update(groupMembers)
      .set({ roleId: newRoleId })
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, memberIdToUpdate),
          eq(groupMembers.isActive, true)
        )
      );

    return {
      success: true,
      message: `Member role updated to ${newRole.name}`,
    };
  }
  // getuserinvitations
  async getuserinvitations(userId: string) {
    const userInvitations = await db
      .select({
        invitation: invitations,
        group : groups,
        inviter:{
          id : usersTable.id,
          name : usersTable.username
        },
        role: {
          id : roles.id,
          roleName : roles.name
        }
      })
      .from(invitations)
      .innerJoin(groups, eq(invitations.groupId, groups.id))
      .innerJoin(usersTable, eq(invitations.inviterId, usersTable.id))
      .innerJoin(roles, eq(invitations.roleId, roles.id))
      .where(
        and(
          eq(invitations.inviteeId, userId),
          eq(invitations.status, "pending")
        )
      );

    return userInvitations;
  }
}
export const groupService = new GroupService();
