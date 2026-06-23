import type { APIRoute } from 'astro';
import { db } from '@smauii/db';
import { projects } from '@smauii/db';
import { eq } from 'drizzle-orm';
import { createErrorResponse, createSuccessResponse, ErrorCode } from '@smauii/shared';
import { updateProjectSchema } from '@smauii/validation';

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const { user } = locals;
  if (!user) return createErrorResponse('Unauthorized', 401);

  const { id } = params;
  if (!id) return createErrorResponse('ID diperlukan', 400);

  try {
    const project = await db.query.projects.findFirst({ where: eq(projects.id, id) });
    if (!project) return createErrorResponse('Project tidak ditemukan', 404, { code: ErrorCode.NOT_FOUND });

    if (project.userId !== user.id && user.role !== 'maintainer') {
      return createErrorResponse('Forbidden', 403);
    }

    const body = await request.json();
    const parsed = updateProjectSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return createErrorResponse(firstError.message, 400);
    }

    const { title, description, url, imageUrl } = parsed.data;

    await db.update(projects)
      .set({
        title: title ?? project.title,
        description: description ?? project.description,
        url: url ?? project.url,
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
    if (!project) return createErrorResponse('Project tidak ditemukan', 404, { code: ErrorCode.NOT_FOUND });

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

