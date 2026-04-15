import type { APIRoute } from 'astro';
import { db } from '@db';
import { projects } from '@db/schema';
import { eq } from 'drizzle-orm';
import { createErrorResponse, createSuccessResponse } from '@lib/api-utils';

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const { user } = locals;
  if (!user) return createErrorResponse('Unauthorized', 401);

  const { id } = params;
  if (!id) return createErrorResponse('ID diperlukan', 400);

  try {
    const project = await db.query.projects.findFirst({ where: eq(projects.id, id) });
    if (!project) return createErrorResponse('Project tidak ditemukan', 404, { code: 'NOT_FOUND' });

    // Hanya owner atau maintainer yang bisa edit
    if (project.userId !== user.id && user.role !== 'maintainer') {
      return createErrorResponse('Forbidden', 403);
    }

    let body: unknown;
    try { body = await request.json(); }
    catch { return createErrorResponse('Invalid JSON', 400); }

    const { title, description, url, imageUrl } = body as Record<string, string>;
    if (!title || title.trim() === '') {
      return createErrorResponse('Judul tidak boleh kosong', 422, { code: 'VALIDATION_ERROR' });
    }

    await db.update(projects)
      .set({
        title: title.trim(),
        description: description?.trim() || null,
        url: url?.trim() || null,
        imageUrl: imageUrl !== undefined ? (imageUrl || null) : project.imageUrl,
      })
      .where(eq(projects.id, id));

    return createSuccessResponse({ success: true });
  } catch (error) {
    console.error('Update project error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const { user } = locals;
  if (!user) return createErrorResponse('Unauthorized', 401);

  const { id } = params;
  if (!id) return createErrorResponse('ID diperlukan', 400);

  try {
    const project = await db.query.projects.findFirst({ where: eq(projects.id, id) });
    if (!project) return createErrorResponse('Project tidak ditemukan', 404, { code: 'NOT_FOUND' });

    // Hanya owner atau maintainer yang bisa hapus
    if (project.userId !== user.id && user.role !== 'maintainer') {
      return createErrorResponse('Forbidden', 403);
    }

    await db.delete(projects).where(eq(projects.id, id));
    return createSuccessResponse({ success: true });
  } catch (error) {
    console.error('Delete project error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};
