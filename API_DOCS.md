# API Documentation with Swagger

Your Notice Board API now includes interactive Swagger documentation for all endpoints.

## Accessing the Documentation

### Local Development

Visit: **http://localhost:3000/api-docs**

### Production

Visit: **https://your-app.onrender.com/api-docs**

## Features

✅ **Complete API Coverage** - All endpoints documented with:

- Request/Response schemas
- Authentication requirements
- Example payloads
- Error responses

✅ **Interactive Testing** - Test endpoints directly from the browser:

1. Click "Authorize" button
2. Enter your JWT token
3. Try any endpoint with sample data

✅ **Organized by Tags**:

- 🔐 **Authentication** - Login, register, profile management
- 👥 **Groups** - Create and manage groups
- 📝 **Posts** - Create, approve, and manage posts
- 💬 **Interactions** - Comments and likes
- 🔔 **Notifications** - User notifications
- 🔍 **Search** - Search functionality
- 👤 **Guest** - Guest operations
- ❤️ **Health** - System health checks

## Authentication in Swagger

To test protected endpoints:

1. **Login first**: Use `/api/auth/login` endpoint
2. **Copy the access token** from the response
3. **Click "Authorize"** button at the top
4. **Paste token** in the "bearerAuth" field
5. **Click "Authorize"** and close the modal
6. Now you can test all protected endpoints! 🎉

## Example Workflows

### 1. User Registration & Login

```
POST /api/auth/register → Register new user
POST /api/auth/login    → Get access token
GET  /api/auth/me       → Verify authentication
```

### 2. Create Group & Post

```
POST /api/group/create           → Create group
POST /api/posts                  → Create post in group
POST /api/posts/{postId}/submit  → Submit for approval
POST /api/posts/{postId}/approve → Approve post
```

### 3. Interactions

```
GET  /api/posts/{postId}                     → View post
POST /api/interactions/{postId}/comment      → Add comment
POST /api/interactions/{postId}/like         → Like post
```

## Environment Variables Required

Swagger automatically reads from your environment:

- `PORT` - Server port
- All other configs from `.env`

## Swagger Configuration

Configuration file: `src/config/swagger.config.ts`

To update:

- Servers: Add production URL
- Schemas: Add/modify data models
- Tags: Organize endpoint categories

## Tips

💡 **Use "Try it out"** - Click on any endpoint to test it live
💡 **Check schemas** - Scroll down to see all data models
💡 **Export** - Download OpenAPI spec for other tools
💡 **Share** - Send the `/api-docs` URL to frontend developers

## Deployment Note

When deploying to production, update the production server URL in:

```typescript
// src/config/swagger.config.ts
servers: [
  {
    url: "https://your-app.onrender.com",
    description: "Production server",
  },
];
```

## Need More Documentation?

To add docs for a new endpoint, use JSDoc comments:

```typescript
/**
 * @swagger
 * /api/your-endpoint:
 *   post:
 *     summary: Endpoint description
 *     tags: [YourTag]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
```

---

🚀 **Happy API Testing!**
