import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import { CORS_ORIGIN } from "./utils/env";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware";
import { authRouter } from "./routes/auth/auth.routes";
import { cronRouter } from "./routes/cron.routes";

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

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/auth", authRouter);
app.use("/cron", cronRouter);

app.use(errorHandler);

export default app;
