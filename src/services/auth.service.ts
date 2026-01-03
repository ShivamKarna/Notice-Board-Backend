import { eq } from "drizzle-orm";
import { db } from "../db/postgres/db.postgres";
import { userSessions, usersTable } from "../db/postgres/schemas";
import { ApiError } from "../utils/ApiError";
import { STATUS_CODE } from "../types/httpStatus";
import type { loginInput, RegisterInput } from "../utils/auth/validations";
import { comparePassword, hashPassword } from "../utils/auth/password";
import { AppAssert } from "../utils/AppAssert";
import { createUserSession } from "../utils/auth/session";
import { createRefreshToken, signAccessToken } from "../utils/auth/jwt";
import { revokeAllUserTokens, revokeToken } from "../utils/auth/refreshToken";

export class AuthService {
  async registerUser(input: RegisterInput) {
    //check if existing
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new ApiError(STATUS_CODE.CONFLICT, "Email already registered");
    }
    // check if username taken
    const existingUserName = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, input.username))
      .limit(1);
    if (existingUserName.length > 0) {
      throw new ApiError(STATUS_CODE.CONFLICT, "Username already taken");
    }
    //hash password
    const hashedPassword = await hashPassword(input.password);
    //create new user
    const [newUser] = await db
      .insert(usersTable)
      .values({
        username: input.username.toLowerCase(),
        email: input.email,
        password: hashedPassword,
      })
      .returning({
        id: usersTable.id,
        username: usersTable.username,
        email: usersTable.email,
        createdAt: usersTable.createdAt,
      });
    AppAssert(
      newUser,
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      "Failed to create user"
    );

    //create session
    const session = await createUserSession(newUser.id);
    AppAssert(
      session,
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      "Failed to create session"
    );
    //generate token
    const accesstokeninput = {
      userId: newUser.id,
      email: newUser.email,
      sessionId: session.id,
    };
    const accessToken = signAccessToken(accesstokeninput);

    const refreshToken = await createRefreshToken(newUser.id);

    // return response
    return {
      user: newUser,
      accessToken,
      refreshToken: refreshToken.token,
      sessionToken: session.sessionToken,
    };
  }
  async loginUser(input: loginInput) {
    // find user // check password, // update last login , //create session // generate tokens //return response
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .limit(1);

    AppAssert(user, STATUS_CODE.UNAUTHORIZED, "Incorrect email or password");

    const isPasswordCorrect = await comparePassword(
      input.password,
      user.password
    );
    AppAssert(
      isPasswordCorrect,
      STATUS_CODE.UNAUTHORIZED,
      "Incorrect email or password"
    );

    await db
      .update(usersTable)
      .set({ lastLoginAt: new Date() })
      .where(eq(usersTable.id, user.id));

    const session = await createUserSession(user.id);
    AppAssert(
      session,
      STATUS_CODE.INTERNAL_SERVER_ERROR,
      "Failed to create session"
    );

    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      sessionId: session.id,
    });

    const refreshToken = await createRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      accessToken,
      refreshToken: refreshToken.token,
      sessionToken: session.sessionToken,
    };
  }
  async logoutuser(userId: string, refreshtoken?: string) {
    if (refreshtoken) {
      await revokeToken(refreshtoken, "User logged Out");
    } else {
      await revokeAllUserTokens(userId, "User logged Out from all Devices");
    }
  }

  async getUserById(userId: string) {
    const [user] = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        email: usersTable.email,
        createdAt: usersTable.createdAt,
        lastLoginAt: usersTable.lastLoginAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId));
    return user || null;
  }
}

export const authService = new AuthService();
