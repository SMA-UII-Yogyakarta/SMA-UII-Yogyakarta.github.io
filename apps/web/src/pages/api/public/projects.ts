import { db } from '@smauii/db';
import { projects, users } from '@smauii/db';
import { sql, desc, eq } from 'drizzle-orm';
import type { APIRoute } from 'astro';
import { createErrorResponse, createSuccessResponse } from '@smauii/shared';

export const GET: APIRoute = async ({ url }) => {
  try {
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '12', 10)));
    const offset = (page - 1) * limit;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects);
    const total = countResult[0]?.count ?? 0;

const data = await db
      .select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
        url: projects.url,
        imageUrl: projects.imageUrl,
        createdAt: projects.createdAt,
        userId: projects.userId,
        userName: users.name,
      })
      .from(projects)
      .leftJoin(users, eq(projects.userId, users.id))
      .orderBy(desc(projects.createdAt))
      .limit(limit)
      .offset(offset);

    return createSuccessResponse({ data, total, page, limit });
  } catch (error) {
    console.error('Failed to fetch public projects:', error);
    return createErrorResponse('Failed to fetch projects', 500);
  }
};
