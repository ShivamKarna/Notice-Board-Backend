# Notice Board Backend API

A comprehensive notice board backend API built with Bun, Express, TypeScript, Neon PostgreSQL, Upstash Redis, and Cloudinary.

## ✨ Features

- 🔐 **Authentication & Authorization**: JWT-based auth with access/refresh tokens, session management
- 👥 **User Management**: Complete profile management with images, cover photos, and bio
- 📝 **Posts**: Create, update, delete posts with media uploads and approval workflow
- 👍 **Interactions**: Like/unlike posts, comments with nested replies
- 🔔 **Notifications**: Real-time notification system with preferences
- 🔍 **Search**: Full-text search for users, posts, and groups with advanced filtering
- 📊 **Groups**: Create and manage groups with role-based access control
- ⭐ **Group Favorites**: Favorite/unfavorite groups, view trending groups
- 👤 **Guest Access**: Public feed and content browsing for unauthenticated users
- ☁️ **Media Upload**: Cloudinary integration for images with optimization
- 🗄️ **Database**: Neon PostgreSQL with Drizzle ORM
- ⚡ **Cache**: Upstash Redis for optimized queries and session management
- 📚 **API Documentation**: Complete Swagger/OpenAPI documentation

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) installed
- Neon PostgreSQL database
- Upstash Redis account
- Cloudinary account

### Installation

```bash
bun install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server
NODE_ENV=development
PORT=3000

# Database (Neon PostgreSQL)
POSTGRES_DATABASE_URL=postgresql://user:password@host.neon.tech/database?sslmode=require

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# JWT Secrets
JWT_SECRET=your_jwt_secret_here
JWT_SECRET_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
JWT_REFRESH_SECRET_EXPIRES_IN=7d
SESSION_SECRET=your_session_secret_here

# CORS & Client
CORS_ORIGIN=http://localhost:5173
CLIENT_URL=http://localhost:5173

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Cron Jobs (Optional)
CRON_SECRET=your_cron_secret_for_scheduled_jobs

# Cache TTL (in seconds)
CACHE_TTL_SHORT=300
CACHE_TTL_MEDIUM=1800
CACHE_TTL_LONG=3600
CACHE_TTL_VERY_LONG=86400
```

See `.env.example` for reference.

### Database Setup

```bash
# Push schema to database
bun run db:push

# Generate migrations (if needed)
bun run db:generate
```

### Run Development Server

```bash
bun run dev
```

Server will start at `http://localhost:3000`

### Health Check

Visit `http://localhost:3000/health` to verify the server is running.

## 📚 API Documentation

### Interactive Swagger UI

Once the server is running, visit:

**Local**: `http://localhost:3000/api-docs`

Features:

- 🎯 Interactive API testing
- 📖 Complete endpoint documentation
- 🔐 Built-in authentication
- 📝 Request/response schemas
- 💡 Example payloads

See [API_DOCS.md](API_DOCS.md) for detailed documentation guide.

## 📮 Postman Collection

Import the `postman_collection.json` file into Postman for quick API testing!

### What's Included:

- All API endpoints with sample data
- Automatic token management
- Pre-configured environment variables
- Request examples for all features

### How to Use:

1. Import `postman_collection.json` into Postman
2. Update the `baseUrl` variable (default: `http://localhost:3000/api`)
3. Start with **Register** or **Login** endpoints
4. Tokens are automatically saved and used in subsequent requests

## 🛣️ API Routes Overview

### Authentication (`/api/auth`)

- User registration with profile/cover images
- Login/logout with JWT tokens
- Token refresh mechanism
- Session management (view, revoke sessions)
- Profile updates (bio, images, username)
- Account deletion

### Groups (`/api/group`, `/api/groups`)

- Create, update, delete groups
- Public/private group visibility
- Member management (invite, remove, role updates)
- Group invitations (accept/decline)
- Group posts retrieval
- **Favorites**: Like/unlike groups, view favorites

### Posts (`/api/posts`)

- CRUD operations for posts
- Media upload (multiple images)
- Post approval workflow (submit, approve, reject)
- Status tracking (draft, pending, approved, rejected)
- User-specific post retrieval

### Interactions (`/api/interactions`)

- **Likes**: Like/unlike posts, get like counts, check if liked
- **Comments**: Create, update, delete comments with nested replies
- Get user's liked posts

### Notifications (`/api/notifications`)

- Get user notifications with pagination
- Unread count tracking
- Mark as read (single/all)
- Delete notifications
- Notification preferences management

### Search (`/api/search`)

- Search groups by name/description
- Search posts by title/content with filters
- Search users by username/email/name
- Advanced post filtering (date, status, author, sorting)

### Guest (`/api/guest`)

- Public group discovery
- Trending groups and posts
- Public feed access
- Guest session management

### Health & Cron (`/api/cron`, `/health`)

- Health check endpoint
- Automated token cleanup (internal)
- User account cleanup (internal)

## 🛠️ Tech Stack

- **Runtime**: [Bun](https://bun.sh) - Fast JavaScript runtime
- **Framework**: Express.js - Web framework
- **Language**: TypeScript - Type safety
- **Database**: [Neon](https://neon.tech) PostgreSQL - Serverless Postgres
- **ORM**: Drizzle - TypeScript ORM
- **Cache**: [Upstash](https://upstash.com) Redis - Serverless Redis
- **File Storage**: [Cloudinary](https://cloudinary.com) - Media management
- **Authentication**: JWT (jsonwebtoken) - Token-based auth
- **Validation**: Zod - Schema validation
- **API Docs**: Swagger/OpenAPI - Interactive documentation

## 📁 Project Structure

```
notice-board-backend/
├── src/
│   ├── app.ts              # Express app configuration
│   ├── index.ts            # Entry point
│   ├── config/             # Configuration files
│   │   ├── cloudinary.config.ts
│   │   ├── drizzle.config.ts
│   │   ├── redis.config.ts
│   │   └── swagger.config.ts
│   ├── controllers/        # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── group.controller.ts
│   │   ├── groupLikes.controller.ts
│   │   ├── guest.controller.ts
│   │   ├── interactions.controller.ts
│   │   ├── notification.controller.ts
│   │   ├── post.controller.ts
│   │   └── search.controller.ts
│   ├── db/                 # Database
│   │   ├── postgres/
│   │   │   ├── db.postgres.ts
│   │   │   └── schemas/   # Drizzle schemas
│   │   └── migrations/     # Migration scripts
│   ├── middlewares/        # Express middlewares
│   │   ├── auth.middleware.ts
│   │   ├── cron.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── guest.middleware.ts
│   │   ├── upload.middleware.ts
│   │   └── validation.middleware.ts
│   ├── routes/             # API routes
│   │   ├── index.ts        # Route aggregator
│   │   ├── auth/
│   │   ├── group/
│   │   ├── groupLikes/
│   │   ├── post/
│   │   ├── interaction/
│   │   ├── notifications/
│   │   ├── search/
│   │   ├── guest/
│   │   └── cron.routes.ts
│   ├── services/           # Business logic
│   │   ├── auth.service.ts
│   │   ├── group.service.ts
│   │   ├── groupsLikes.service.ts
│   │   ├── guest.service.ts
│   │   ├── interactions.service.ts
│   │   ├── notification.service.ts
│   │   ├── post.service.ts
│   │   ├── redis_cache.service.ts
│   │   ├── refreshToken.service.ts
│   │   └── search.service.ts
│   ├── types/              # TypeScript types
│   │   ├── express.d.ts
│   │   └── httpStatus.ts
│   └── utils/              # Helper functions
│       ├── auth/           # Auth utilities
│       ├── CommentSchemas/ # Validation schemas
│       ├── GroupSchemas/
│       ├── PostSchemas/
│       └── notificationPreferencesSchemas/
├── drizzle/                # Generated migrations
├── .env                    # Environment variables
├── .env.example            # Environment template
├── package.json
├── tsconfig.json
├── postman_collection.json # Postman API collection
├── API_DOCS.md            # Swagger documentation guide
├── DEPLOYMENT.md          # Deployment instructions
└── README.md              # This file
```

## 📝 Available Scripts

```bash
# Development
bun run dev          # Start development server with auto-reload

# Production
bun run build        # Build for production
bun run start        # Start production server

# Database
bun run db:generate  # Generate Drizzle migrations
bun run db:migrate   # Run migrations (if using migrate command)
bun run db:push      # Push schema changes directly to DB
```

## 🚀 Deployment

### Deploy to Render

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete step-by-step deployment guide including:

- Setting up Upstash Redis
- Configuring Neon PostgreSQL
- Deploying to Render
- Environment variables setup
- Production considerations

**Quick Deploy Steps:**

1. Push code to GitHub
2. Create Render Web Service
3. Connect GitHub repository
4. Configure environment variables
5. Deploy!

### Production Checklist

- Set `NODE_ENV=production`
- Use strong JWT secrets
- Configure CORS for your frontend domain
- Set up Upstash Redis
- Configure Neon PostgreSQL with SSL
- Update Cloudinary settings
- Test all endpoints with Swagger docs

## 📖 Documentation

- [API_DOCS.md](API_DOCS.md) - Swagger documentation guide
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment instructions
- [USER_PROFILE_FEATURE.md](USER_PROFILE_FEATURE.md) - Profile feature details
- [Swagger UI](http://localhost:3000/api-docs) - Interactive API docs (when running)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

---

**Built with ❤️ using Bun, Express, PostgreSQL, and Redis**

_For questions or support, please open an issue on GitHub._
