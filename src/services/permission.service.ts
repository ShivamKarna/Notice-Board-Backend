import { and, eq } from "drizzle-orm";
import { db } from "../db/postgres/db.postgres";
import {
  groupMembers,
  roles,
  permissions,
  rolePermissions,
} from "../db/postgres/schemas";
import { group } from "console";

export class PermissionService {
  // has permission
  async hasPermission(
    userId: string,
    groupId: string,
    permissionAction: string
  ): Promise<boolean> {
    const result = await db
      .select({
        permission: permissions.action,
      })
      .from(groupMembers)
      .innerJoin(roles, eq(groupMembers.roleId, roles.id))
      .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(
        and(
          eq(groupMembers.userId, userId),
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.isActive, true),
          eq(permissions.action, permissionAction)
        )
      )
      .limit(1);

    return result.length > 0;
  }
  // get user role
  async getUserRole (userId: string, groupId : string){
    const [member] = await db
      .select({
        roleId : groupMembers.roleId,
        roleName : roles.name,
        roleLevel : roles.level,
        canPost : groupMembers.canPost,
        canComment : groupMembers.canComment,
        isActive : groupMembers.isActive,
      })
      .from(groupMembers)
      .innerJoin(roles,eq(groupMembers.roleId, roles.id))
      .where(
        and(
          eq(groupMembers.userId, userId),
          eq(groupMembers.groupId,groupId),
          eq(groupMembers.isActive,true)
        )
      ).limit(1);
    return member || null;
  }
  // check if user is owner
  async isOwner(userId : string, groupId:string):Promise<boolean>{
    const role = await this.getUserRole(userId, groupId);
    return role?.roleName === 'Owner';
  }
  // check if user is admin or owner
  async isOwnerOrAdmin(userId : string, groupId:string):Promise<boolean>{
    const role = await this.getUserRole(userId, groupId);
    return role?.roleName === 'Owner'|| role?.roleName ==='Admin';
  }
  // check if user is member of group
  async isMember(userId: string, groupId : string):Promise<boolean>{
    const result = await this.getUserRole(userId, groupId);
    return result !== null;
  }
  // get all permissoin for a user in a group
  async getAllPermissions(
    userId: string,
    groupId: string,
    permissionAction: string
  ): Promise<string[]> {
    const result = await db
      .select({
        permission: permissions.action,
      })
      .from(groupMembers)
      .innerJoin(roles, eq(groupMembers.roleId, roles.id))
      .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(
        and(
          eq(groupMembers.userId, userId),
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.isActive, true),
          eq(permissions.action, permissionAction)
        )
      )
      .limit(1);
    return result.map(r => r.permission);
  }


  // get role by name
  async getRoleByName(name : string){
    const answer = await db.select().from(roles).where(eq(roles.name,name)).limit(1); 

    return answer || null;
  }
  // get role by id
  async getRoleById (userId : string){
    const role = await db.select().from(roles).where(eq(roles.id,userId)).limit(1);

    return role || null;
  }
}

const permissionService = new PermissionService();
