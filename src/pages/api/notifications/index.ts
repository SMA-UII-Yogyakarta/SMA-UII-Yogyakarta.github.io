import { db } from '@db';
import { notifications } from '@db/schema';
import { eq, desc } from 'drizzle-orm';
import type { APIRoute } from 'astro';
import { lucia } from '@lib/auth';
import { createErrorResponse, createSuccessResponse } from '@lib/api-utils';

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

    const userNotifications = await db
      .select({
        id: notifications.id,
        message: notifications.message,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(20);

    return createSuccessResponse(userNotifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};