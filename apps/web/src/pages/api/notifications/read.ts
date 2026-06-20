import { db } from '@smauii/db';
import { notifications } from '@smauii/db';
import { eq } from 'drizzle-orm';
import type { APIRoute } from 'astro';
import { createErrorResponse, createSuccessResponse } from '@smauii/shared';
import { markNotificationReadSchema } from '@smauii/validation';

export const POST: APIRoute = async ({ locals, request }) => {
  const { user } = locals;
  if (!user) return createErrorResponse('Unauthorized', 401);

  try {
    const body = await request.json();
    const parsed = markNotificationReadSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return createErrorResponse(firstError.message, 400);
    }
    
    const { id } = parsed.data;

    await db.update(notifications).set({ isRead: 1 }).where(eq(notifications.id, id));
    return createSuccessResponse({ success: true });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};
