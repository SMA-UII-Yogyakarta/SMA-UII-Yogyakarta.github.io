import { db } from '@db';
import { activities, users } from '@db/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import type { APIRoute } from 'astro';
import { lucia } from '@lib/auth';
import { createErrorResponse, createSuccessResponse } from '@lib/api-utils';
import { nanoid } from 'nanoid';

export const GET: APIRoute = async ({ cookies, url }) => {
  try {
    const sessionId = cookies.get(lucia.sessionCookieName)?.value ?? null;
    
    if (!sessionId) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { session, user } = await lucia.validateSession(sessionId);
    if (!session || !user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const type = url.searchParams.get('type');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    let conditions = [];

    if (user.role !== 'maintainer') {
      conditions.push(eq(activities.userId, user.id));
    }

    if (type) {
      conditions.push(eq(activities.type, type));
    }

    if (startDate) {
      conditions.push(gte(activities.createdAt, parseInt(startDate)));
    }

    if (endDate) {
      conditions.push(lte(activities.createdAt, parseInt(endDate)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const allActivities = await db
      .select({
        id: activities.id,
        type: activities.type,
        title: activities.title,
        description: activities.description,
        url: activities.url,
        createdAt: activities.createdAt,
        userId: activities.userId,
        userName: users.name,
      })
      .from(activities)
      .leftJoin(users, eq(activities.userId, users.id))
      .where(whereClause)
      .orderBy(desc(activities.createdAt))
      .limit(100);

    return createSuccessResponse({ activities: allActivities, stats: [] });
  } catch (error) {
    console.error('Get activities error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};

export const POST: APIRoute = async ({ cookies, request }) => {
  try {
    const sessionId = cookies.get(lucia.sessionCookieName)?.value ?? null;
    
    if (!sessionId) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { session, user } = await lucia.validateSession(sessionId);
    if (!session || !user) {
      return createErrorResponse('Unauthorized', 401);
    }

    if (user.status !== 'active') {
      return createErrorResponse('Only active members can log activities', 403);
    }

    const body = await request.json();
    const { type, title, description, url } = body;

    if (!type || !title) {
      return createErrorResponse('Type and title required', 400);
    }

    const id = nanoid();
    const now = Date.now();

    await db.insert(activities).values({
      id,
      userId: user.id,
      type,
      title,
      description: description || null,
      url: url || null,
      createdAt: now,
    });

    return createSuccessResponse({ id, success: true });
  } catch (error) {
    console.error('Create activity error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};