import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db/postgres/db.postgres";
import {
  notificationPreferences,
  notifications,
  userSessions,
} from "../db/postgres/schemas";
import { cacheService } from "./redis_cache.service";
import { UpdateNotificationPreferencesSchema } from "../utils/notificationPreferencesSchemas/notificationPreferences.validation.ts";
interface createNotificationInput {
  userId: string;
  type: string;
  relatedEntityType: string;
  relatedEntityId: string;
  message: string;
}
export class NotificationService {
  private readonly CACHE_TTL_SHORT = parseInt(
    process.env.CACHE_TTL_SHORT || "300",
  );
  async getUserPreferences(userId: string) {
    // Try cache first
    const cached = await cacheService.get<any>(
      "user-notification-prefs",
      userId,
    );

    if (cached) {
      return cached;
    }

    // Check if preferences exist
    let [prefs] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    // Create default preferences if not exist
    if (!prefs) {
      [prefs] = await db
        .insert(notificationPreferences)
        .values({ userId })
        .returning();
    }

    // Cache preferences
    await cacheService.set("user-notification-prefs", userId, prefs, 3600); // 1 hour

    return prefs;
  }

  async updateUserPreferences(userId: string, input: any) {
    const [updated] = await db
      .update(notificationPreferences)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(notificationPreferences.userId, userId))
      .returning();

    await cacheService.delete("user-notification-prefs", userId);

    return updated;
  }

  // check if user wants this type of notification
  private async shouldNotify(
    userId: string,
    notificationType: string,
  ): Promise<boolean> {
    const prefs = await this.getUserPreferences(userId);

    // Map notification types to preference fields
    const typeMapping: Record<string, keyof typeof prefs> = {
      post_approval: "postApprovalNeeded",
      post_approved: "postApproved",
      post_rejected: "postRejected",
      post_like: "postLiked",
      comment_reply: "postCommented",
      comment_replied: "commentReplied",
      group_invite: "groupInvite",
      member_joined: "memberJoined",
      member_removed: "memberRemoved",
      role_changed: "roleChanged",
      system_announcement: "systemAnnouncements",
    };

    const prefField = typeMapping[notificationType];

    // If no mapping or preference is true, send notification
    return !prefField || prefs[prefField] === true;
  }

  async createNotification(input: createNotificationInput) {
    const shouldSend = await this.shouldNotify(input.userId, input.type);

    if (!shouldSend) {
      return null;
    }
    const [notification] = await db
      .insert(notifications)
      .values({
        ...input,
        isRead: false,
      })
      .returning();

    await cacheService.delete("user-notifications", input.userId);
    await cacheService.delete("user-notifications-unread", input.userId);
    await cacheService.increment("user-unread-count", input.userId);

    return notification;
  }

  async getUserNotification(userId: string, unReadOnly = false) {
    const cacheKey = unReadOnly
      ? "user-notifications-unread"
      : "user-notifications";

    const cache = await cacheService.get<
      Array<typeof notifications.$inferSelect>
    >(cacheKey, userId);

    if (cache) {
      return cache;
    }
    const whereCondition = unReadOnly
      ? and(eq(notifications.userId, userId), eq(notifications.isRead, false))
      : eq(notifications.userId, userId);

    const userNotifications = db
      .select()
      .from(notifications)
      .where(whereCondition)
      .orderBy(desc(notifications.createdAt));

    // cache
    await cacheService.set(
      cacheKey,
      userId,
      userNotifications,
      this.CACHE_TTL_SHORT,
    );

    return userNotifications;
  }

  async markAsRead(notificationId: string, userId: string) {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId),
        ),
      );

    // invalidate cache
    await cacheService.delete("user-notifications", userId);
    await cacheService.delete("user-notifications-unread", userId);
    await cacheService.decrement("user-unread-count", userId);
  }

  async getUnreadCount(userId: string) {
    const cached = await cacheService.get<number>("user-unread-count", userId);

    if (cached !== null) {
      return cached;
    }

    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
      );

    const count = result?.count || 0;

    await cacheService.set(
      "user-unread-count",
      userId,
      count,
      this.CACHE_TTL_SHORT,
    );
    return count;
  }

  async markAllAsRead(userId: string) {
    await db
      .update(notifications)
      .set({
        isRead: true,
      })
      .where(eq(notifications.userId, userId));

    // update cache
    await cacheService.delete("user-notifications", userId);
    await cacheService.delete("user-notifications-unread", userId);
    await cacheService.set(
      "user-unread-count",
      userId,
      0,
      this.CACHE_TTL_SHORT,
    );
  }

  async deleteNotification(notificationId: string, userId: string) {
    await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId),
        ),
      );
    // Invalidate cache
    await cacheService.delete("user-notifications", userId);
    await cacheService.delete("user-notifications-unread", userId);
  }

  async deleteAllRead(userId: string) {
    await db
      .delete(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, true)),
      );

    // Invalidate cache
    await cacheService.delete("user-notifications", userId);
  }
}

export const notificationService = new NotificationService();
