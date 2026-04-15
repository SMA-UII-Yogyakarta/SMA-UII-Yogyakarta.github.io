import { db } from '@db';
import { announcements, users, notifications } from '@db/schema';
import { eq, desc } from 'drizzle-orm';
import type { APIRoute } from 'astro';
import { lucia } from '@lib/auth';
import { createErrorResponse, createSuccessResponse } from '@lib/api-utils';
import { nanoid } from 'nanoid';

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const sessionId = cookies.get(lucia.sessionCookieName)?.value ?? null;
    
    if (!sessionId) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { session, user } = await lucia.validateSession(sessionId);
    if (!session || !user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const allAnnouncements = await db
      .select({
        id: announcements.id,
        title: announcements.title,
        content: announcements.content,
        createdAt: announcements.createdAt,
        creatorName: users.name,
      })
      .from(announcements)
      .leftJoin(users, eq(announcements.createdBy, users.id))
      .orderBy(desc(announcements.createdAt));

    return createSuccessResponse(allAnnouncements);
  } catch (error) {
    console.error('Get announcements error:', error);
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

    if (user.role !== 'maintainer') {
      return createErrorResponse('Forbidden', 403);
    }

    const body = await request.json();
    const { title, content } = body;

    if (!title || !content) {
      return createErrorResponse('Title and content required', 400);
    }

    const id = nanoid();
    const now = Date.now();

    await db.insert(announcements).values({
      id,
      title,
      content,
      createdBy: user.id,
      createdAt: now,
    });

    const allMembers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.status, 'active'));

    const notifRecords = allMembers.map(m => ({
      id: nanoid(),
      userId: m.id,
      message: `New announcement: ${title}`,
      isRead: 0,
      createdAt: now,
    }));

    if (notifRecords.length > 0) {
      await db.insert(notifications).values(notifRecords);
    }

    return createSuccessResponse({ id, success: true });
  } catch (error) {
    console.error('Create announcement error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};