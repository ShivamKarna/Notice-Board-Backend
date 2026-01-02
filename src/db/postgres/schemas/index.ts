// Auth schemas
export * from './auth.schema';

// RBAC schemas
export * from './rbac.schema';

// Group schemas
export * from './groups.schema';

// Invitation schemas
export * from './invitations.schema';

// Post schemas
export * from './posts.schema';

// Media schemas
export * from './media.schema';

// Interaction schemas
export * from './interactions.schema';

// Notification schemas
export * from './notifications.schema';

// Optionally export grouped schemas
export { usersTable, userSessions } from './auth.schema'; 
export { roles, permissions, rolePermissions } from './rbac.schema';
export { groups, groupMembers, groupLikes } from './groups.schema';
export { invitations } from './invitations.schema';
export { posts, postApprovals } from './posts.schema';
export { media } from './media.schema';
export { comments, likes } from './interactions.schema';
export { notifications } from './notifications.schema';
