import type { AccesstokenPayload } from "../utils/auth/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: AccesstokenPayload;
      sessionId?: string;
      sessionToken?: string;
    }
  }
}

export {};
