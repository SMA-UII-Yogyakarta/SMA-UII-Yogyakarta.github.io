import { db } from '@db';
import { notifications } from '@db/schema';
import { eq } from 'drizzle-orm';
import type { APIRoute } from 'astro';
import { createErrorResponse, createSuccessResponse } from '@lib/api-utils';

export const POST: APIRoute = async ({ locals, request }) => {
  const { session, user } = locals;
  if (!session || !user) return createErrorResponse('Unauthorized', 401);

  try {
    const { id } = await request.json();
    if (!id) return createErrorResponse('Notification ID required', 400);

    await db.update(notifications).set({ isRead: 1 }).where(eq(notifications.id, id));
    return createSuccessResponse({ success: true });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};
