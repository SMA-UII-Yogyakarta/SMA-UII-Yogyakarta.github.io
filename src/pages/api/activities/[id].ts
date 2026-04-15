import type { APIRoute } from 'astro';
import { db } from '@db';
import { activities } from '@db/schema';
import { eq } from 'drizzle-orm';
import { createErrorResponse, createSuccessResponse } from '@lib/api-utils';

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
