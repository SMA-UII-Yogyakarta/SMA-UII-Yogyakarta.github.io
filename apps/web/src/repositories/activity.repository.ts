/**
 * Activity Repository
 * Centralized data access layer for activity operations
 */

import { db } from '@smauii/db';
import { activities, type Activity, type InsertActivity } from '@smauii/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';

export const activityRepository = {
  /**
   * Find activity by ID
   */
  findById: async (id: string): Promise<Activity | undefined> => {
    return db.query.activities.findFirst({
      where: eq(activities.id, id),
    });
  },

  /**
   * Get activities by user ID with pagination
   */
  findByUserId: async (userId: string, limit = 10, page = 1) => {
    const offset = (page - 1) * limit;
    
    const [data, countResult] = await Promise.all([
      db
        .select()
        .from(activities)
        .where(eq(activities.userId, userId))
        .orderBy(desc(activities.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(activities)
        .where(eq(activities.userId, userId)),
    ]);

    const total = countResult[0]?.count ?? 0;

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Get all activities with filters
   */
  findAll: async (options?: {
    userId?: string;
    type?: string;
    limit?: number;
    page?: number;
  }) => {
    const { userId, type, limit = 10, page = 1 } = options || {};
    const offset = (page - 1) * limit;

    const conditions = [];
    if (userId) conditions.push(eq(activities.userId, userId));
    if (type) conditions.push(eq(activities.type, type));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db
        .select()
        .from(activities)
        .where(whereClause)
        .orderBy(desc(activities.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(activities)
        .where(whereClause),
    ]);

    const total = countResult[0]?.count ?? 0;

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Create new activity
   */
  create: async (data: InsertActivity): Promise<Activity> => {
    const [activity] = await db.insert(activities).values(data).returning();
    return activity;
  },

  /**
   * Update activity by ID
   */
  update: async (id: string, data: Partial<InsertActivity>): Promise<Activity | undefined> => {
    const [activity] = await db
      .update(activities)
      .set(data)
      .where(eq(activities.id, id))
      .returning();
    return activity;
  },

  /**
   * Delete activity by ID
   */
  delete: async (id: string): Promise<boolean> => {
    const result = await db.delete(activities).where(eq(activities.id, id));
    return (result?.rowsAffected ?? 0) > 0;
  },

  /**
   * Count activities by user
   */
  countByUser: async (userId: string): Promise<number> => {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(activities)
      .where(eq(activities.userId, userId));
    return result[0]?.count ?? 0;
  },

  /**
   * Count activities this month
   */
  countThisMonth: async (): Promise<number> => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(activities)
      .where(sql`${activities.createdAt} >= ${startOfMonth.getTime()}`);
    
    return result[0]?.count ?? 0;
  },
};