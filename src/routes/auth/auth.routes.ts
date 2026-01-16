// TODO: update user controller, service, and routes is remaining to do

import { Router } from "express";
import { authController } from "../../controllers/auth.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} from "../../utils/auth/validations";
import {
  uploadSingle,
  handleMulterError,
  uploadRegistrationImages,
} from "../../middlewares/upload.middleware";
import { z } from "zod";

const authRouter = Router();

// prefix : http://localhost:3000/auth/

// public route
authRouter.post(
  "/register",
  uploadRegistrationImages,
  handleMulterError,
  validate(registerSchema),
  authController.registerUser
);

authRouter.post("/login", validate(loginSchema), authController.loginUser);

authRouter.post("/refresh", authController.refreshTheTokens);

// protected routes

authRouter.post("/logout", authenticate, authController.logoutUser);

authRouter.get("/me", authenticate, authController.Me);
authRouter.get("/sessions", authenticate, authController.allSessions);
authRouter.get("/sessions/:id", authenticate, authController.getSessionById);
authRouter.delete("/sessions", authenticate, authController.revokeAllSessions);
authRouter.delete(
  "/sessions/:id",
  authenticate,
  authController.revokeSessionById
);

authRouter.delete("/account", authenticate, authController.deleteAccount);

// Profile Management Routes
authRouter.patch(
  "/profile",
  authenticate,
  validate(z.object({ body: updateProfileSchema })),
  authController.updateProfile
);

authRouter.patch(
  "/profile/image",
  authenticate,
  uploadSingle,
  handleMulterError,
  authController.updateProfileImage
);

authRouter.patch(
  "/profile/cover",
  authenticate,
  uploadSingle,
  handleMulterError,
  authController.updateCoverImage
);

export { authRouter };
