import { db } from '@smauii/db';
import { notifications } from '@smauii/db';
import { eq, desc } from 'drizzle-orm';
import type { APIRoute } from 'astro';
import { createErrorResponse, createSuccessResponse } from '@smauii/shared';

export const GET: APIRoute = async ({ locals }) => {
  const { user } = locals;
  if (!user) return createErrorResponse('Unauthorized', 401);

  try {
    const userNotifications = await db
      .select({ id: notifications.id, message: notifications.message, isRead: notifications.isRead, createdAt: notifications.createdAt )
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
