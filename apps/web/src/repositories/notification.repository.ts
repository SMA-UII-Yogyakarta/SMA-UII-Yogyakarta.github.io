/**
 * Notification Repository
 * Centralized data access layer for notification operations
 */

import { db } from '@smauii/db';
import { notifications, type Notification, type InsertNotification } from '@smauii/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export const notificationRepository = {
  /**
   * Find notification by ID
   */
  findById: async (id: string): Promise<Notification | undefined> => {
    return db.query.notifications.findFirst({
      where: eq(notifications.id, id),
    });
  },

  /**
   * Get notifications by user ID
   */
  findByUserId: async (userId: string, limit = 20): Promise<Notification[]> => {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  },

  /**
   * Get unread notifications count
   */
  countUnreadByUserId: async (userId: string): Promise<number> => {
    const result = await db
      .select({ count: db.$count() })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    return result[0]?.count ?? 0;
  },

  /**
   * Create new notification
   */
  create: async (data: InsertNotification): Promise<Notification> => {
    const [notification] = await db.insert(notifications).values(data).returning();
    return notification;
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (id: string): Promise<Notification | undefined> => {
    const [notification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  },

  /**
   * Mark all notifications as read for user
   */
  markAllAsRead: async (userId: string): Promise<void> => {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  },

  /**
   * Delete notification by ID
   */
  delete: async (id: string): Promise<boolean> => {
    const result = await db.delete(notifications).where(eq(notifications.id, id));
    return (result?.rowsAffected ?? 0) > 0;
  },

  /**
   * Delete old notifications (older than 30 days)
   */
  deleteOld: async (days = 30): Promise<number> => {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const result = await db
      .delete(notifications)
      .where(sql`${notifications.createdAt} < ${cutoff}`);
    return result?.rowsAffected ?? 0;
  },
};