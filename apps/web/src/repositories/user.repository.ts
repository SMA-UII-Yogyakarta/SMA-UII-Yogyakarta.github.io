/**
 * User Repository
 * Centralized data access layer for user operations
 */

import { db } from '@smauii/db';
import { users, type User, type InsertUser } from '@smauii/db/schema';
import { eq, inArray } from 'drizzle-orm';

export const userRepository = {
  /**
   * Find user by ID
   */
  findById: async (id: string): Promise<User | undefined> => {
    return db.query.users.findFirst({
      where: eq(users.id, id),
    });
  },

  /**
   * Find user by NIS
   */
  findByNis: async (nis: string): Promise<User | undefined> => {
    return db.query.users.findFirst({
      where: eq(users.nis, nis),
    });
  },

  /**
   * Find user by email
   */
  findByEmail: async (email: string): Promise<User | undefined> => {
    return db.query.users.findFirst({
      where: eq(users.email, email),
    });
  },

  /**
   * Find user by GitHub username
   */
  findByGithubUsername: async (githubUsername: string): Promise<User | undefined> => {
    return db.query.users.findFirst({
      where: eq(users.githubUsername, githubUsername),
    });
  },

  /**
   * Find user by GitHub ID
   */
  findByGithubId: async (githubId: string): Promise<User | undefined> => {
    return db.query.users.findFirst({
      where: eq(users.githubId, githubId),
    });
  },

  /**
   * Get all active members
   */
  findActiveMembers: async (limit = 10, offset = 0) => {
    return db
      .select({
        id: users.id,
        name: users.name,
        class: users.class,
        role: users.role,
        joinedAt: users.joinedAt,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.status, 'active'))
      .limit(limit)
      .offset(offset);
  },

  /**
   * Count active members
   */
  countActiveMembers: async (): Promise<number> => {
    const result = await db
      .select({ count: db.$count() })
      .from(users)
      .where(eq(users.status, 'active'));
    return result[0]?.count ?? 0;
  },

  /**
   * Create new user
   */
  create: async (data: InsertUser): Promise<User> => {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  },

  /**
   * Update user by ID
   */
  update: async (id: string, data: Partial<InsertUser>): Promise<User | undefined> => {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  },

  /**
   * Delete user by ID
   */
  delete: async (id: string): Promise<boolean> => {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result?.rowsAffected ?? 0) > 0;
  },

  /**
   * Get user statistics
   */
  getStats: async () => {
    const allUsers = await db.select({
      status: users.status,
      role: users.role,
    }).from(users);

    return {
      total: allUsers.length,
      active: allUsers.filter(u => u.status === 'active').length,
      pending: allUsers.filter(u => u.status === 'pending').length,
      inactive: allUsers.filter(u => u.status === 'inactive').length,
      maintainers: allUsers.filter(u => u.role === 'maintainer').length,
    };
  },
};