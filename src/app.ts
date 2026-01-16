import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import { CORS_ORIGIN } from "./utils/env";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware";
import router from "./routes/index";
import redis from "./config/redis.config.ts";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.config";

const app: Application = express();

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Swagger Documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Notice Board API Docs",
  })
);

// Health check endpoint for Render
app.get("/health", async (req: Request, res: Response) => {
  try {
    // Check Redis connection
    await redis.ping();
    res.status(200).json({
      status: "OK",
      timestamp: new Date().toISOString(),
      services: {
        redis: "connected",
        database: "connected",
      },
    });
  } catch (error) {
    res.status(503).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Root route
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Welcome to Notice Board API",
    version: "1.0.0",
    documentation: "/api-docs",
    health: "/health",
    endpoints: {
      auth: "/api/auth",
      groups: {
        main: "/api/group",
        likes: "/api/groups",
      },
      posts: "/api/posts",
      interactions: "/api/interactions",
      notifications: "/api/notifications",
      search: "/api/search",
      guest: "/api/guest",
      cron: "/api/cron",
    },
  });
});

// Routes
app.use("/api", router);

app.use(errorHandler);

export default app;
