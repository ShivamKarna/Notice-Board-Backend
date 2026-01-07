import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/postgres/db.postgres";
import { notifications } from "../db/postgres/schemas";

interface createNotificationInput {
  userId: string;
  type: string;
  relatedEntityType: string;
  relatedEntityId: string;
  message: string;
}
export class NotificationService {
  async createNotification(input: createNotificationInput) {
    const [notification] = await db
      .insert(notifications)
      .values({
        ...input,
        isRead: false,
      })
      .returning();

    return notification;
  }

  async getUserNotification(userId: string, unReadOnly = false) {
    const whereCondition = unReadOnly
      ? and(eq(notifications.userId, userId), eq(notifications.isRead, false))
      : eq(notifications.userId, userId);

    return db
      .select()
      .from(notifications)
      .where(whereCondition)
      .orderBy(desc(notifications.createdAt));
  }

  async markAsRead(notificationId: string, userId: string) {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      );
  }

  async markAllAsRead(userId: string) {
    await db
      .update(notifications)
      .set({
        isRead: true,
      })
      .where(eq(notifications.userId, userId));
  }
}

export const notificationService = new NotificationService();
