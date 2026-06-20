/**
 * Project Repository
 * Centralized data access layer for project operations
 */

import { db } from '@smauii/db';
import { projects, users, type Project, type InsertProject } from '@smauii/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export const projectRepository = {
  /**
   * Find project by ID
   */
  findById: async (id: string): Promise<Project | undefined> => {
    return db.query.projects.findFirst({
      where: eq(projects.id, id),
    });
  },

  /**
   * Get all projects with pagination
   */
  findAll: async (limit = 10, page = 1) => {
    const offset = (page - 1) * limit;
    
    const [data, countResult] = await Promise.all([
      db
        .select({
          id: projects.id,
          title: projects.title,
          description: projects.description,
          url: projects.url,
          imageUrl: projects.imageUrl,
          userId: projects.userId,
          userName: users.name,
          createdAt: projects.createdAt,
        })
        .from(projects)
        .leftJoin(users, eq(projects.userId, users.id))
        .orderBy(desc(projects.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(projects),
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
   * Get projects by user ID
   */
  findByUserId: async (userId: string): Promise<Project[]> => {
    return db.query.projects.findMany({
      where: eq(projects.userId, userId),
      orderBy: desc(projects.createdAt),
    });
  },

  /**
   * Create new project
   */
  create: async (data: InsertProject): Promise<Project> => {
    const [project] = await db.insert(projects).values(data).returning();
    return project;
  },

  /**
   * Update project by ID
   */
  update: async (id: string, data: Partial<InsertProject>): Promise<Project | undefined> => {
    const [project] = await db
      .update(projects)
      .set(data)
      .where(eq(projects.id, id))
      .returning();
    return project;
  },

  /**
   * Delete project by ID
   */
  delete: async (id: string): Promise<boolean> => {
    const result = await db.delete(projects).where(eq(projects.id, id));
    return (result?.rowsAffected ?? 0) > 0;
  },

  /**
   * Count total projects
   */
  count: async (): Promise<number> => {
    const result = await db.select({ count: db.$count() }).from(projects);
    return result[0]?.count ?? 0;
  },
};