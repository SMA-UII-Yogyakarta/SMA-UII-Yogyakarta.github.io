import type { APIRoute } from 'astro';
import { db } from '@smauii/db';
import { announcements } from '@smauii/db';
import { eq } from 'drizzle-orm';
import { createErrorResponse, createSuccessResponse } from '@smauii/shared';
import { updateAnnouncementSchema } from '@smauii/validation';

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const { user } = locals;
  if (!user || user.role !== 'maintainer') return createErrorResponse('Forbidden', 403);

  const { id } = params;
  if (!id) return createErrorResponse('ID diperlukan', 400);

  try {
    const announcement = await db.query.announcements.findFirst({ where: eq(announcements.id, id) });
    if (!announcement) return createErrorResponse('Pengumuman tidak ditemukan', 404, { code: 'NOT_FOUND' });

    const body = await request.json();
    const parsed = updateAnnouncementSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return createErrorResponse(firstError.message, 400);
    }

    const { title, content, isPinned } = parsed.data;

    const updateData: Record<string, unknown> = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (isPinned !== undefined) updateData.isPinned = isPinned ? 1 : 0;

    if (Object.keys(updateData).length === 0) {
      return createErrorResponse('Tidak ada data yang diubah', 400);
    }

    await db.update(announcements)
      .set(updateData)
      .where(eq(announcements.id, id));

    return createSuccessResponse({ success: true });
  } catch (error) {
    console.error('Update announcement error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const { user } = locals;
  if (!user || user.role !== 'maintainer') return createErrorResponse('Forbidden', 403);

  const { id } = params;
  if (!id) return createErrorResponse('ID diperlukan', 400);

  try {
    const announcement = await db.query.announcements.findFirst({ where: eq(announcements.id, id) });
    if (!announcement) return createErrorResponse('Pengumuman tidak ditemukan', 404, { code: 'NOT_FOUND' });

    await db.delete(announcements).where(eq(announcements.id, id));
    return createSuccessResponse({ success: true });
  } catch (error) {
    console.error('Delete announcement error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};
