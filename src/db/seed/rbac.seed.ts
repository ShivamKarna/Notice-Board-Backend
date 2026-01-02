import { STATUS_CODE } from "../../types/httpStatus.ts";
import { AppAssert } from "../../utils/AppAssert.ts";
import { db } from "../postgres/db.postgres.ts";
import {
  roles,
  permissions,
  rolePermissions,
} from "../postgres/schemas/index.ts";

export async function seedRBAC() {
  console.log("Seeding RBAC data...");

  //create roles
  const [ownerRole] = await db
    .insert(roles)
    .values({
      name: "Owner",
      level: 3,
    })
    .returning();

  AppAssert(
    ownerRole,
    STATUS_CODE.BAD_REQUEST,
    "Owner role is not created in DB"
  );
  const [adminRole] = await db
    .insert(roles)
    .values({
      name: "Admin",
      level: 2,
    })
    .returning();

  AppAssert(
    adminRole,
    STATUS_CODE.BAD_REQUEST,
    "Owner role is not created in DB"
  );
  const [memberRole] = await db
    .insert(roles)
    .values({
      name: "Member",
      level: 1,
    })
    .returning();

  AppAssert(
    memberRole,
    STATUS_CODE.BAD_REQUEST,
    "Owner role is not created in DB"
  );
  console.log("Roles created successFully !!");

  // create permissions
  const permissionsList = [
    { action: "post:create" },
    { action: "post:edit" },
    { action: "post:delete" },
    { action: "user:invite" },
    { action: "user:remove" },
    { action: "user:promote" },
    { action: "group:edit" },
    { action: "group:delete" },
    { action: "comment:delete" },
    { action: "post:approve" },
    { action: "post:reject" },
    { action: "notification:manage" },
  ];
  const createdPermissions = await db
    .insert(permissions)
    .values(permissionsList)
    .returning();

  console.log("Permissions Created .... !");

  // assign permissions to roles
  // owner gets all permissions
  const ownerPermissions = createdPermissions.map((p) => ({
    roleId: ownerRole.id,
    permissionId: p.id,
  }));
  // admin gets most permisions except for group delete, user promote
  const adminPermissionsActionArray = [
    "post:create",
    "post:edit",
    "post:delete",
    "user:invite",
    "comment:delete",
    "post:approve",
    "post:reject",
    "notification:manage",
  ];

  const adminPermissions = createdPermissions
    .filter((p) => adminPermissionsActionArray.includes(p.action))
    .map((p) => ({
      roleId: adminRole.id,
      permissionId: p.id,
    }));
  // member can only create and edit own posts
  const memberPermissionsActionArray = ["post:create", "post:edit"];
  const memberPermissions = createdPermissions
    .filter((p) => memberPermissionsActionArray.includes(p.action))
    .map((p) => ({
      roleId: memberRole.id,
      permissionId: p.id,
    }));

  await db
    .insert(rolePermissions)
    .values([...ownerPermissions, ...adminPermissions, ...memberPermissions]);

  console.log("Role permissions assigned SuccessFully");
  console.log("RBAC seeding complete");
  // return the role and premissions
  return {
    roles: { owner: ownerRole, admin: adminRole, member: memberRole },
    permissions: createdPermissions,
  };
}

// can also run from terminal
if (require.main === module) {
  seedRBAC()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seeding failed....", err);
      process.exit(1);
    });
}
