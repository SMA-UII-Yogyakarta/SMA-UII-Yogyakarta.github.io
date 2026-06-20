import type { APIRoute } from 'astro';
import { db } from '@smauii/db';
import { learningProgress } from '@smauii/db';
import { checkAndAwardBadges } from '@smauii/db/badges';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { createErrorResponse, createSuccessResponse } from '@smauii/shared';
import { learningProgressSchema } from '@smauii/validation';

// GET /api/learn/progress?slug=... — cek apakah lesson sudah selesai
export const GET: APIRoute = async ({ locals, url }) => {
  const { user } = locals;
  if (!user) return createErrorResponse('Unauthorized', 401);

  try {
    const slug = url.searchParams.get('slug');
    if (!slug) return createErrorResponse('slug required', 400);

    const progress = await db.query.learningProgress.findFirst({
      where: and(
        eq(learningProgress.userId, user.id),
        eq(learningProgress.lessonSlug, slug),
      ),
    });

    return createSuccessResponse({ completed: !!progress, completedAt: progress?.completedAt ?? null });
  } catch (error) {
    console.error('Get learning progress error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};

// POST /api/learn/progress — tandai selesai / batalkan
export const POST: APIRoute = async ({ locals, request }) => {
  const { user } = locals;
  if (!user) return createErrorResponse('Unauthorized', 401);
  if (user.status !== 'active') return createErrorResponse('Forbidden', 403);

  try {
    const body = await request.json();
    const parsed = learningProgressSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return createErrorResponse(firstError.message, 400);
    }
    
    const { slug, completed } = parsed.data;

    if (completed) {
      const existing = await db.query.learningProgress.findFirst({
        where: and(eq(learningProgress.userId, user.id), eq(learningProgress.lessonSlug, slug)),
      });
      if (!existing) {
        await db.insert(learningProgress).values({ id: nanoid(), userId: user.id, lessonSlug: slug, completedAt: Date.now() });
        checkAndAwardBadges(user.id, db).catch((e) => { console.error('Badge check error:', e); });
      }
    } else {
      await db.delete(learningProgress).where(
        and(eq(learningProgress.userId, user.id), eq(learningProgress.lessonSlug, slug))
      );
    }

    return createSuccessResponse({ success: true });
  } catch (error) {
    console.error('Update learning progress error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};
