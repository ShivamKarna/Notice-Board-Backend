import { userSessions, usersTable } from "../../db/postgres/schemas";
import { db } from "../../db/postgres/db.postgres";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

export function generateSessionToken(): string {
  return randomBytes(64).toString("hex");
}

export async function createGuestSession() {
  const token = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
  const [session] = await db
    .insert(userSessions)
    .values({
      sessionToken: token,
      isGuest: true,
      userId: null,
      expiresAt,
    })
    .returning();
  return session;
}

export async function createUserSession(userId: string) {
  const token = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
  const [session] = await db
    .insert(userSessions)
    .values({
      sessionToken: token,
      isGuest: true,
      userId,
      expiresAt,
    })
    .returning();
  return session;
}

export async function getSessionByToken(token: string) {
  const [session] = await db
    .select()
    .from(userSessions)
    .where(eq(userSessions.sessionToken, token))
    .limit(1);

  if (!session) return null;

  // Check if expired
  if (new Date() > session.expiresAt) {
    await db.delete(userSessions).where(eq(userSessions.id, session.id));
    return null;
  }

  // Update last activity
  await db
    .update(userSessions)
    .set({ lastActivity: new Date() })
    .where(eq(userSessions.id, session.id));

  return session;
}
export async function convertGuestToUserSession(
  sessionToken: string,
  userId: string
) {
  await db
    .update(userSessions)
    .set({
      userId,
      isGuest: false,
    })
    .where(eq(userSessions.sessionToken, sessionToken));
}

export async function deleteSession(token: string) {
  await db.delete(userSessions).where(eq(userSessions.sessionToken, token));
}
