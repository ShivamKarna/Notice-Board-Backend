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
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api", router);

app.use(errorHandler);

export default app;
