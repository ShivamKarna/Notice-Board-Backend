import { Router } from "express";
import { authRouter } from "./auth/auth.routes";
import { cronRouter } from "./cron.routes";
import { groupRouter } from "./group/group.routes";
import { postRouter } from "./post/post.routes";
const router = Router();

// prefix :   /api/v1/

router.use("/auth", authRouter);
router.use("/cron", cronRouter);
router.use("/group", groupRouter);
router.use("/posts",postRouter);

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

export default router;
