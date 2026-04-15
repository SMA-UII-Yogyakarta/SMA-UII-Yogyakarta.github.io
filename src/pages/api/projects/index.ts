import { db } from '@db';
import { projects, users } from '@db/schema';
import { eq, desc } from 'drizzle-orm';
import type { APIRoute } from 'astro';
import { createErrorResponse, createSuccessResponse } from '@lib/api-utils';
import { nanoid } from 'nanoid';

export const GET: APIRoute = async ({ locals, url }) => {
  const { session, user } = locals;
  if (!session || !user) return createErrorResponse('Unauthorized', 401);

  try {
    const userIdParam = url.searchParams.get('userId');
    let whereClause;
    if (userIdParam) whereClause = eq(projects.userId, userIdParam);
    else if (user.role !== 'maintainer') whereClause = eq(projects.userId, user.id);

    const allProjects = await db
      .select({ id: projects.id, title: projects.title, description: projects.description, url: projects.url, imageUrl: projects.imageUrl, createdAt: projects.createdAt, userId: projects.userId, userName: users.name })
      .from(projects)
      .leftJoin(users, eq(projects.userId, users.id))
      .where(whereClause)
      .orderBy(desc(projects.createdAt));

    return createSuccessResponse(allProjects);
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
