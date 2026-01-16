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

// Routes
app.use("/api", router);

app.use(errorHandler);

export default app;
