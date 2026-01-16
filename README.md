# notice-board-backend

A comprehensive notice board backend API built with Express, TypeScript, PostgreSQL, and Cloudinary.

## Features

- 🔐 **Authentication & Authorization**: JWT-based auth with access/refresh tokens
- 👥 **User Management**: Profile management with images and bio
- 📝 **Posts**: Create, update, delete posts with media uploads
- 👍 **Interactions**: Like/unlike posts, comments with replies
- 🔔 **Notifications**: Real-time notification system
- 🔍 **Search**: Full-text search for users, posts, and groups
- 📊 **Groups**: Create and manage groups with role-based access
- ☁️ **Media Upload**: Cloudinary integration for images
- 🗄️ **Database**: PostgreSQL with Drizzle ORM
- 🚀 **Performance**: Redis caching for optimized queries

## Quick Start

### Installation

```bash
bun install
```

### Environment Variables

Create a `.env` file with:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/notice_board
REDIS_URL=redis://localhost:6379
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

### Database Setup

```bash
# Generate migrations
bun run db:generate

# Apply migrations
bun run db:push
```

### Run Development Server

```bash
bun run dev
```

Server will start at `http://localhost:3000`

## API Testing with Postman

Import the `postman_collection.json` file into Postman to get started instantly!

### What's Included:

All API endpoints with sample data
Automatic token management
Pre-configured environment variables
Request examples for all features

### How to Use:

1. Import `postman_collection.json` into Postman
2. Update the `baseUrl` variable if needed (default: `http://localhost:3000/api`)
3. Start with **Register** or **Login** to get authentication tokens
4. Tokens are automatically saved to collection variables
5. All protected endpoints will use the saved token automatically

## API Documentation

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/profile` - Update profile
- `PATCH /api/auth/profile/image` - Upload profile image
- `PATCH /api/auth/profile/cover` - Upload cover image

### Groups

- `POST /api/group/create` - Create group
- `GET /api/group` - Get user groups
- `GET /api/group/public` - Get public groups
- `PATCH /api/group/:id` - Update group
- `DELETE /api/group/:id` - Delete group
- `POST /api/group/:id/members/invite` - Invite member

### Posts

- `POST /api/posts` - Create post
- `GET /api/posts/:id` - Get post by ID
- `PATCH /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/submit` - Submit for approval
- `POST /api/posts/:id/approve` - Approve post
- `POST /api/posts/:id/media` - Upload media

### Interactions

- `POST /api/interactions/posts/:id/like` - Like post
- `DELETE /api/interactions/posts/:id/like` - Unlike post
- `POST /api/interactions/posts/:id/comments` - Add comment
- `PATCH /api/interactions/comments/:id` - Update comment
- `DELETE /api/interactions/comments/:id` - Delete comment

### Notifications

- `GET /api/notifications` - Get notifications
- `GET /api/notifications/unread/count` - Unread count
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read

### Search

- `GET /api/search/users` - Search users
- `GET /api/search/posts` - Search posts
- `GET /api/search/groups` - Search groups
- `GET /api/search/filter/posts` - Filter posts

## Tech Stack

- **Runtime**: Bun
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Drizzle
- **Cache**: Redis (ioredis)
- **File Upload**: Cloudinary
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod

## Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── db/             # Database schemas and migrations
├── middlewares/    # Express middlewares
├── routes/         # API routes
├── services/       # Business logic
├── types/          # TypeScript types
└── utils/          # Helper functions
```

## New Features

### User Profile Management

See [USER_PROFILE_FEATURE.md](USER_PROFILE_FEATURE.md) for detailed documentation on:

- Profile image upload
- Cover image upload
- Bio and username updates
- Validation rules
- Error handling

## Scripts

```bash
bun run dev          # Start development server
bun run build        # Build for production
bun run start        # Start production server
bun run db:generate  # Generate migrations
bun run db:migrate   # Run migrations
bun run db:push      # Push schema changes
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

---

Built with ❤️ using Bun
