ok so this stuff is done (phases 1-3):

1. Authentication System

   - user registration/login
   - jwt access tokens (15min)
   - refresh tokens with rotation (30 days)
   - session management
   - logout (single & all devices)
   - password hashing

2. RBAC System

   - roles (owner, admin, member)
   - permissions system
   - role-permission mappings
   - database seeding

3. Group Management
   - create/update/delete groups
   - get user groups & public groups
   - invite system with tokens
   - accept/decline invitations
   - member management (add/remove)
   - promote/demote members
   - leave group
   - permission checking

STILL GOTTA DO THIS STUFF

PHASE 4: Post Creation & Approval System (next)

- create posts (draft mode)
- submit posts for approval
- approve/reject posts (admin/owner)
- edit posts
- delete posts
- get posts (by group, by user, by status)
- media attachments (multiple images per post)
- post visibility (public/members-only)
- approval notifications

PHASE 5: Interactions System (after phase 4)
Comments:

- add comment to post
- edit comment
- delete comment (own or admin/owner)
- get comments for post
- comment notifications

Likes:

- like/unlike post
- get post likes count
- get users who liked a post
- like notifications

Group Likes (Favorites):

- like/unlike group
- get user's favorite groups

PHASE 6: Notification System Enhancement (after phase 5)

- get all notifications
- mark as read (single/all)
- delete notifications
- notification preferences

PHASE 7: Guest Mode Implementation (after phase 6)

- guest session creation
- guest browsing (view posts only)
- guest to user conversion
- guest restrictions middleware
- public vs members-only content filtering

PHASE 8: Search & Filtering (optional)

- search groups by name/description
- search posts by title/content
- search users
- filter posts by date, author, status
- sort options (newest, oldest, most liked)

PHASE 9: Advanced Features (optional)
Analytics:

- group statistics (posts, members, engagement)
- user activity tracking
- popular posts/groups

Moderation:

- report posts/comments
- flagged content review
- user blocking

Additional Features:

- post scheduling (publish at specific time)
- post expiration (auto-archive old posts)
- group categories/tags
- pinned posts
- post templates

PHASE 10: Admin Panel Support (optional)

- system-wide user management
- platform statistics
- audit logs
- content moderation dashboard
