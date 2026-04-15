import { db } from '@db';
import { notifications } from '@db/schema';
import { eq } from 'drizzle-orm';
import type { APIRoute } from 'astro';
import { lucia } from '@lib/auth';
import { createErrorResponse, createSuccessResponse } from '@lib/api-utils';

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

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return createErrorResponse('Notification ID required', 400);
    }

    await db
      .update(notifications)
      .set({ isRead: 1 })
      .where(eq(notifications.id, id));

    return createSuccessResponse({ success: true });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};