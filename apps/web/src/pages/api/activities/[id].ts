import type { APIRoute } from 'astro';
import { db } from '@smauii/db';
import { activities } from '@smauii/db';
import { eq } from 'drizzle-orm';
import { createErrorResponse, createSuccessResponse } from '@smauii/shared';
import { createActivitySchema } from '@smauii/validation';

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const { user } = locals;
  if (!user) return createErrorResponse('Unauthorized', 401);

  const { id } = params;
  if (!id) return createErrorResponse('ID diperlukan', 400);

  try {
    const activity = await db.query.activities.findFirst({ where: eq(activities.id, id) });
    if (!activity) return createErrorResponse('Activity tidak ditemukan', 404, { code: 'NOT_FOUND' });

    if (activity.userId !== user.id && user.role !== 'maintainer') {
      return createErrorResponse('Forbidden', 403);
    }

    const body = await request.json();
    const parsed = createActivitySchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return createErrorResponse(firstError.message, 400);
    }

    const { type, title, description, url } = parsed.data;
    await db.update(activities});
      .set({ type, title, description: description || null, url: url || null }});
      .where(eq(activities.id, id));

    return createSuccessResponse({ success: true });
  } catch (error) {
    console.error('Update activity error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const { user } = locals;
  if (!user) return createErrorResponse('Unauthorized', 401);

  const { id } = params;
  if (!id) return createErrorResponse('ID diperlukan', 400);

  try {
    const activity = await db.query.activities.findFirst({ where: eq(activities.id, id) });
    if (!activity) return createErrorResponse('Activity tidak ditemukan', 404, { code: 'NOT_FOUND' });

    // Hanya owner atau maintainer yang bisa hapus
    if (activity.userId !== user.id && user.role !== 'maintainer') {
      return createErrorResponse('Forbidden', 403);
    }

    await db.delete(activities).where(eq(activities.id, id));
    return createSuccessResponse({ success: true });
  } catch (error) {
    console.error('Delete activity error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};
