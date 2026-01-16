import swaggerJsdoc from "swagger-jsdoc";
import { PORT } from "../utils/env";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Notice Board API",
      version: "1.0.0",
      description:
        "Complete API documentation for Notice Board backend application with authentication, groups, posts, and notifications",
      contact: {
        name: "API Support",
        email: "support@noticeboard.com",
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Development server",
      },
      {
        url: "https://your-production-url.onrender.com",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "accessToken",
          description: "JWT token stored in HTTP-only cookie",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "error",
            },
            message: {
              type: "string",
              example: "An error occurred",
            },
            statusCode: {
              type: "number",
              example: 400,
            },
          },
        },
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "usr_123456",
            },
            email: {
              type: "string",
              example: "user@example.com",
            },
            username: {
              type: "string",
              example: "johndoe",
            },
            fullName: {
              type: "string",
              example: "John Doe",
            },
            profileImage: {
              type: "string",
              nullable: true,
              example: "https://cloudinary.com/image.jpg",
            },
            coverImage: {
              type: "string",
              nullable: true,
              example: "https://cloudinary.com/cover.jpg",
            },
            bio: {
              type: "string",
              nullable: true,
              example: "Software developer",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Group: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "grp_123456",
            },
            name: {
              type: "string",
              example: "Tech Team",
            },
            description: {
              type: "string",
              example: "Technology discussion group",
            },
            isPublic: {
              type: "boolean",
              example: true,
            },
            createdBy: {
              type: "string",
              example: "usr_123456",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Post: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "post_123456",
            },
            title: {
              type: "string",
              example: "Important Announcement",
            },
            content: {
              type: "string",
              example: "This is the post content",
            },
            status: {
              type: "string",
              enum: ["draft", "pending", "approved", "rejected"],
              example: "approved",
            },
            groupId: {
              type: "string",
              example: "grp_123456",
            },
            authorId: {
              type: "string",
              example: "usr_123456",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Notification: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "notif_123456",
            },
            type: {
              type: "string",
              example: "post_approved",
            },
            message: {
              type: "string",
              example: "Your post has been approved",
            },
            isRead: {
              type: "boolean",
              example: false,
            },
            userId: {
              type: "string",
              example: "usr_123456",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Authentication",
        description: "User authentication and session management endpoints",
      },
      {
        name: "Groups",
        description: "Group management and membership operations",
      },
      {
        name: "Posts",
        description: "Post creation, approval, and management",
      },
      {
        name: "Interactions",
        description: "Comments and likes on posts",
      },
      {
        name: "Notifications",
        description: "User notification management",
      },
      {
        name: "Search",
        description: "Search across posts, groups, and users",
      },
      {
        name: "Guest",
        description: "Guest user operations",
      },
      {
        name: "Health",
        description: "System health check endpoints",
      },
    ],
  },
  apis: ["./src/routes/**/*.ts", "./src/controllers/**/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
