

// TODO: update user controller, service, and routes is remaining to do 



import { Router } from "express";
import { authController } from "../../controllers/auth.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { registerSchema, loginSchema } from "../../utils/auth/validations";

const authRouter = Router();

// prefix : http://localhost:3000/auth/

// public route
authRouter.post(
  "/register",
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

export { authRouter };
