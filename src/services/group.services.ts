import { and, desc, eq, notInArray } from "drizzle-orm";
import { db } from "../db/postgres/db.postgres";
import {
  groupMembers,
  groups,
  roles,
  usersTable,
} from "../db/postgres/schemas";
import { STATUS_CODE } from "../types/httpStatus";
import { ApiError } from "../utils/ApiError";
import type { CreateGroupInput, UpdateGroupInput } from "../utils/GroupSchemas/group";
import { permissionService } from "./permission.service";
import { group } from "console";

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
  async getusergroups(userid: string) {
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
  async getGroupById(groupId : string, userId? : string) {
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

    if(!group){
      return null;
    }

    const memberCount = await db.select({count : db.$count(groupMembers)}).from(groupMembers).where(and(
      eq(groupMembers.groupId,groupId),
      eq(groupMembers.isActive,true)
    ))

    let userRole  = null;
    let userPermissions : string[] =[];

    if(userId){
      userRole= await permissionService.getUserRole(userId, groupId);
      if(userRole){
        userPermissions = await permissionService.getUserPermissions(userId, groupId);
      }
    }
  }
  // getgroupMembers
  async getgroupMembers(userId : string, groupId : string) {
    const memebers = await db
      .select({
        member : {
          id  : groupMembers.id,
          joinedAt : groupMembers.joinedAt,
          canPost : groupMembers.canPost,
          canComment : groupMembers.canComment,
        },
        userDetails: {
          id : usersTable.id,
          name : usersTable.username,
          email :usersTable.email
        },
        role: {
          id : roles.id,
          name : roles.name,
          level : roles.level
        }
      })
      .from(groupMembers)
      .innerJoin(usersTable,eq(groupMembers.userId, usersTable.id))
      .innerJoin(roles, eq(groupMembers.roleId, roles.id))
      .where(and(
        eq(groupMembers.groupId,groupId),
        eq(groupMembers.isActive,true)
      ))
      .orderBy(desc(roles.level),desc(groupMembers.joinedAt));

    return memebers;
  }
  // updategroup
  async updategroup(groupId: string, userId : string, input:UpdateGroupInput) {
    const isOwnerOrAdmin = await permissionService.isOwnerOrAdmin(userId, groupId);

    if(isOwnerOrAdmin){
      throw new ApiError(STATUS_CODE.UNAUTHORIZED,"Only Owner or Admin can update Group Info's");
    }

    const [updatedGroup] = await db.update(groups).set({
      ...input,
    }).where(eq(groups.id,groupId)).returning();

    return updatedGroup ;
  }
  // deleteGroup
  async deleteGroup(groupId:string,userId : string):Promise<{success:boolean,message: string}> {
    const isOwner = await permissionService.isOwner(userId, groupId);

    if(!isOwner){
      throw new ApiError(STATUS_CODE.UNAUTHORIZED,"Only Owners can delete Group");
    }

    await db.delete(groups).where(eq(groups.id,groupId));


    return {success: true, message : "Group Deleted Successfully"};
  }
  //inviteUserToGroup
  async inviteUserToGroup() {

  }
  // acceptinvitation
  async acceptinvitation() {}
  // declineinvitation
  async declineinvitation() {}
  // removemember
  async removemember() {}
  // leavegroup
  async leavegroup() {}
  // updatememberrole
  async updatememberrole() {}
  // getuserinvitations
  async getuserinvitations() {}
}
export const groupService = new GroupService();
