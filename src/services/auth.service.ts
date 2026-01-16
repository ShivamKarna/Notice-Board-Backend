import { eq, and, lt } from "drizzle-orm";
import { db } from "../db/postgres/db.postgres";
import { usersTable } from "../db/postgres/schemas";
import { ApiError } from "../utils/ApiError";
import { STATUS_CODE } from "../types/httpStatus";
import type { loginInput, RegisterInput } from "../utils/auth/validations";
import type { UpdateProfileInput } from "../utils/auth/validations";
import { comparePassword, hashPassword } from "../utils/auth/password";
import { AppAssert } from "../utils/AppAssert";
import {
  convertGuestToUserSession,
  createUserSession,
} from "../utils/auth/session";
import { createRefreshToken, signAccessToken } from "../utils/auth/jwt";
import { revokeAllUserTokens, revokeToken } from "../utils/auth/refreshToken";
import { guestService } from "./guest.service";

export class AuthService {
  async registerUser(input: RegisterInput, guestSessionToken?: string) {
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
    const insertData: any = {
      username: input.username.toLowerCase(),
      email: input.email,
      password: hashedPassword,
    };

    // Add optional fields if provided
    if (input.profileImage) insertData.profileImage = input.profileImage;
    if (input.coverImage) insertData.coverImage = input.coverImage;
    if (input.bio) insertData.bio = input.bio;

    const [newUser] = await db.insert(usersTable).values(insertData).returning({
      id: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
      profileImage: usersTable.profileImage,
      coverImage: usersTable.coverImage,
      bio: usersTable.bio,
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

    const refreshToken = await createRefreshToken(newUser.id, input.userAgent);

    if (guestSessionToken) {
      await convertGuestToUserSession(guestSessionToken, newUser.id);
    }

    // return response
    return {
      user: newUser,
      accessToken,
      refreshToken: refreshToken.token,
      sessionToken: session.sessionToken,
    };
  }
  async loginUser(input: loginInput, guestSessionToken?: string) {
    // find user // check password, // update last login , //create session // generate tokens //return response
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .limit(1);

    AppAssert(user, STATUS_CODE.UNAUTHORIZED, "Incorrect email or password");

    if (user.isDeleted) {
      throw new ApiError(
        STATUS_CODE.FORBIDDEN,
        "This account has been deleted"
      );
    }

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

    const refreshToken = await createRefreshToken(user.id, input.userAgent);

    if (guestSessionToken) {
      await convertGuestToUserSession(guestSessionToken, user.id);
    }
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
        profileImage: usersTable.profileImage,
        coverImage: usersTable.coverImage,
        bio: usersTable.bio,
        createdAt: usersTable.createdAt,
        lastLoginAt: usersTable.lastLoginAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId));
    return user || null;
  }

  async deleteAccount(userId: string) {
    // Soft delete user account
    const [deletedUser] = await db
      .update(usersTable)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
      })
      .where(eq(usersTable.id, userId))
      .returning({ id: usersTable.id, username: usersTable.username });

    AppAssert(deletedUser, STATUS_CODE.NOT_FOUND, "User not found");

    // Revoke all tokens
    await revokeAllUserTokens(userId, "Account deleted");

    return {
      success: true,
      message:
        "Account scheduled for deletion. Data will be permanently removed after 30 days.",
    };
  }

  async permanentlyDeleteOldAccounts() {
    // Delete accounts that have been soft-deleted for more than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await db
      .delete(usersTable)
      .where(
        and(
          eq(usersTable.isDeleted, true),
          lt(usersTable.deletedAt, thirtyDaysAgo)
        )
      )
      .returning({ id: usersTable.id });

    return result.length;
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    // Check if username is taken (if provided)
    if (input.username) {
      const existingUser = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.username, input.username.toLowerCase()))
        .limit(1);

      if (existingUser.length > 0 && existingUser[0]!.id !== userId) {
        throw new ApiError(STATUS_CODE.CONFLICT, "Username already taken");
      }
    }

    const updateData: any = {};
    if (input.username) updateData.username = input.username.toLowerCase();
    if (input.bio !== undefined) updateData.bio = input.bio;

    const [updatedUser] = await db
      .update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, userId))
      .returning({
        id: usersTable.id,
        username: usersTable.username,
        email: usersTable.email,
        profileImage: usersTable.profileImage,
        coverImage: usersTable.coverImage,
        bio: usersTable.bio,
        createdAt: usersTable.createdAt,
      });

    AppAssert(updatedUser, STATUS_CODE.NOT_FOUND, "User not found");
    return updatedUser;
  }

  async updateProfileImage(userId: string, imageUrl: string) {
    const [updatedUser] = await db
      .update(usersTable)
      .set({ profileImage: imageUrl })
      .where(eq(usersTable.id, userId))
      .returning({
        id: usersTable.id,
        username: usersTable.username,
        email: usersTable.email,
        profileImage: usersTable.profileImage,
        coverImage: usersTable.coverImage,
        bio: usersTable.bio,
      });

    AppAssert(updatedUser, STATUS_CODE.NOT_FOUND, "User not found");
    return updatedUser;
  }

  async updateCoverImage(userId: string, imageUrl: string) {
    const [updatedUser] = await db
      .update(usersTable)
      .set({ coverImage: imageUrl })
      .where(eq(usersTable.id, userId))
      .returning({
        id: usersTable.id,
        username: usersTable.username,
        email: usersTable.email,
        profileImage: usersTable.profileImage,
        coverImage: usersTable.coverImage,
        bio: usersTable.bio,
      });

    AppAssert(updatedUser, STATUS_CODE.NOT_FOUND, "User not found");
    return updatedUser;
  }
}
export const authService = new AuthService();
