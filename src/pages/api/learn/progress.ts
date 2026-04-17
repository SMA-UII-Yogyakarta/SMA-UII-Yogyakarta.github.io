import type { APIRoute } from 'astro';
import { db } from '@db';
import { learningProgress } from '@db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { createErrorResponse, createSuccessResponse } from '@lib/api-utils';

// GET /api/learn/progress?slug=... — cek apakah lesson sudah selesai
export const GET: APIRoute = async ({ locals, url }) => {
  const { user } = locals;
  if (!user) return createErrorResponse('Unauthorized', 401);

  const slug = url.searchParams.get('slug');
  if (!slug) return createErrorResponse('slug required', 400);

  const progress = await db.query.learningProgress.findFirst({
    where: and(
      eq(learningProgress.userId, user.id),
      eq(learningProgress.lessonSlug, slug),
    ),
  });

  return createSuccessResponse({ completed: !!progress, completedAt: progress?.completedAt ?? null });
};

// POST /api/learn/progress — tandai selesai / batalkan
export const POST: APIRoute = async ({ locals, request }) => {
  const { user } = locals;
  if (!user) return createErrorResponse('Unauthorized', 401);
  if (user.status !== 'active') return createErrorResponse('Forbidden', 403);

  const { slug, completed } = await request.json();
  if (!slug) return createErrorResponse('slug required', 400);

  if (completed) {
    // Upsert — insert jika belum ada
    const existing = await db.query.learningProgress.findFirst({
      where: and(eq(learningProgress.userId, user.id), eq(learningProgress.lessonSlug, slug)),
    });
    if (!existing) {
      await db.insert(learningProgress).values({ id: nanoid(), userId: user.id, lessonSlug: slug, completedAt: Date.now() });
    }
  } else {
    await db.delete(learningProgress).where(
      and(eq(learningProgress.userId, user.id), eq(learningProgress.lessonSlug, slug))
    );
  }

  return createSuccessResponse({ success: true });
};
