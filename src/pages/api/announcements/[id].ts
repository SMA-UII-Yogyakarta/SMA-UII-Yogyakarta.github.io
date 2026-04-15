import type { APIRoute } from 'astro';
import { db } from '@db';
import { announcements } from '@db/schema';
import { eq } from 'drizzle-orm';
import { createErrorResponse, createSuccessResponse } from '@lib/api-utils';

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const { user } = locals;
  if (!user || user.role !== 'maintainer') return createErrorResponse('Forbidden', 403);

  const { id } = params;
  if (!id) return createErrorResponse('ID diperlukan', 400);

  try {
    const announcement = await db.query.announcements.findFirst({ where: eq(announcements.id, id) });
    if (!announcement) return createErrorResponse('Pengumuman tidak ditemukan', 404, { code: 'NOT_FOUND' });

    let body: unknown;
    try { body = await request.json(); }
    catch { return createErrorResponse('Invalid JSON', 400); }

    const { title, content } = body as Record<string, string>;
    if (!title?.trim() || !content?.trim()) {
      return createErrorResponse('Judul dan konten tidak boleh kosong', 422, { code: 'VALIDATION_ERROR' });
    }

    await db.update(announcements)
      .set({ title: title.trim(), content: content.trim() })
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
