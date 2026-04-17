import { db } from '@db';
import { activities, users } from '@db/schema';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import type { APIRoute } from 'astro';
import { createErrorResponse, createSuccessResponse } from '@lib/api-utils';
import { nanoid } from 'nanoid';

export const GET: APIRoute = async ({ locals, url }) => {
  const { user } = locals;
  if (!user) return createErrorResponse('Unauthorized', 401);

  try {
    const type = url.searchParams.get('type');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;

    const conditions = [];
    if (user.role !== 'maintainer') conditions.push(eq(activities.userId, user.id));
    if (type) conditions.push(eq(activities.type, type));
    if (startDate) conditions.push(gte(activities.createdAt, parseInt(startDate)));
    if (endDate) conditions.push(lte(activities.createdAt, parseInt(endDate)));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [allActivities, countResult] = await Promise.all([
      db.select({
          id: activities.id, type: activities.type, title: activities.title,
          description: activities.description, url: activities.url,
          createdAt: activities.createdAt, userId: activities.userId, userName: users.name,
        })
        .from(activities)
        .leftJoin(users, eq(activities.userId, users.id))
        .where(whereClause)
        .orderBy(desc(activities.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql`COUNT(*)` }).from(activities).where(whereClause),
    ]);

    return createSuccessResponse({
      activities: allActivities,
      total: Number(countResult[0]?.count || 0),
      page,
      limit,
    });
  } catch (error) {
    console.error('Get activities error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};

export const POST: APIRoute = async ({ locals, request }) => {
  const { user } = locals;
  if (!user) return createErrorResponse('Unauthorized', 401);
  if (user.status !== 'active') return createErrorResponse('Only active members can log activities', 403);

  try {
    const { type, title, description, url } = await request.json();
    if (!type || !title) return createErrorResponse('Type and title required', 400);

    const id = nanoid();
    await db.insert(activities).values({ id, userId: user.id, type, title, description: description || null, url: url || null, createdAt: Date.now() });
    return createSuccessResponse({ id, success: true });
  } catch (error) {
    console.error('Create activity error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};
