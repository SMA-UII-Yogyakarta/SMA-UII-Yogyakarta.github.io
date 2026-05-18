import type { APIRoute } from 'astro';
import { db } from '@smauii/db';
import { announcements } from '@smauii/db';
import { eq } from 'drizzle-orm';
import { createErrorResponse, createSuccessResponse } from '@smauii/shared';

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

    const data = body as Record<string, unknown>;

    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined || data.content !== undefined) {
      const title = data.title as string | undefined;
      const content = data.content as string | undefined;
      if (title !== undefined && !title.trim()) {
        return createErrorResponse('Judul tidak boleh kosong', 422, { code: 'VALIDATION_ERROR' });
      }
      if (content !== undefined && !content.trim()) {
        return createErrorResponse('Konten tidak boleh kosong', 422, { code: 'VALIDATION_ERROR' });
      }
      if (title) updateData.title = title.trim();
      if (content) updateData.content = content.trim();
    }

    if (data.isPinned !== undefined) {
      updateData.isPinned = data.isPinned ? 1 : 0;
    }

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
