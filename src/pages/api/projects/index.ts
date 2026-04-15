import { db } from '@db';
import { projects, users } from '@db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import type { APIRoute } from 'astro';
import { createErrorResponse, createSuccessResponse } from '@lib/api-utils';
import { nanoid } from 'nanoid';

export const GET: APIRoute = async ({ locals, url }) => {
  const { session, user } = locals;
  if (!session || !user) return createErrorResponse('Unauthorized', 401);

  try {
    const userIdParam = url.searchParams.get('userId');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '12'), 50);
    const offset = (page - 1) * limit;

    let whereClause;
    if (userIdParam) whereClause = eq(projects.userId, userIdParam);
    else if (user.role !== 'maintainer') whereClause = eq(projects.userId, user.id);

    const [allProjects, countResult] = await Promise.all([
      db.select({
          id: projects.id, title: projects.title, description: projects.description,
          url: projects.url, imageUrl: projects.imageUrl, createdAt: projects.createdAt,
          userId: projects.userId, userName: users.name,
        })
        .from(projects)
        .leftJoin(users, eq(projects.userId, users.id))
        .where(whereClause)
        .orderBy(desc(projects.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql`COUNT(*)` }).from(projects).where(whereClause),
    ]);

    return createSuccessResponse({
      projects: allProjects,
      total: Number(countResult[0]?.count || 0),
      page,
      limit,
    });
  } catch (error) {
    console.error('Get projects error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};

export const POST: APIRoute = async ({ locals, request }) => {
  const { session, user } = locals;
  if (!session || !user) return createErrorResponse('Unauthorized', 401);
  if (user.status !== 'active') return createErrorResponse('Only active members can add projects', 403);

  try {
    const { title, description, url, imageUrl } = await request.json();
    if (!title) return createErrorResponse('Title required', 400);

    const id = nanoid();
    await db.insert(projects).values({ id, userId: user.id, title, description: description || null, url: url || null, imageUrl: imageUrl || null, createdAt: Date.now() });
    return createSuccessResponse({ id, success: true });
  } catch (error) {
    console.error('Create project error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};
