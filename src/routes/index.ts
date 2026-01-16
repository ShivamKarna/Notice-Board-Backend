import { Router } from "express";
import { authRouter } from "./auth/auth.routes";
import { cronRouter } from "./cron.routes";
import { groupRouter } from "./group/group.routes";
import { groupLikeRouter } from "./groupLikes/groupLikes.routes";
import { postRouter } from "./post/post.routes";
import { interactionsRouter } from "./interaction/comments_likes.routes";
import { notificationRouter } from "./notifications/notification.route";
import { guestRouter } from "./guest/guest.route";
import { searchRouter } from "./search/search.routes";
const router = Router();

// prefix :   localhost/api

router.use("/auth", authRouter);
router.use("/group", groupRouter);
router.use("/groups", groupLikeRouter);
router.use("/posts", postRouter);
router.use("/interactions", interactionsRouter);
router.use("/notifications", notificationRouter);
router.use("/guest", guestRouter);
router.use("/search", searchRouter);
router.use("/cron", cronRouter);

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

export default router;
