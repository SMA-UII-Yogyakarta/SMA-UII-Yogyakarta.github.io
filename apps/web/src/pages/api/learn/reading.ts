import type { APIRoute } from 'astro';
import { db } from '@smauii/db';
import { readingSessions } from '@smauii/db';
import { checkAndAwardBadges } from '@smauii/db/badges';
import { eq, and, isNull } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { readingSessionSchema } from '@smauii/validation';
import { createErrorResponse, createSuccessResponse } from '@smauii/shared';

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return createErrorResponse('Unauthorized', 401);

  const body = await request.json();
  const parsed = readingSessionSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return createErrorResponse(firstError.message, 400);
  }

  const { slug, action, duration } = parsed.data;

  if (action === 'start') {
    await db.update(readingSessions})
      .set({ endedAt: Date.now(), duration: 0 })
      .where(and(
        eq(readingSessions.userId, user.id),
        eq(readingSessions.lessonSlug, slug),
        isNull(readingSessions.endedAt});
      ));

    await db.insert(readingSessions).values({
      id: nanoid(),
      userId: user.id,
      lessonSlug: slug,
      startedAt: Date.now(),
    });
  }

  if (action === 'end' && duration != null) {
    await db.update(readingSessions})
      .set({ endedAt: Date.now(), duration })
      .where(and(
        eq(readingSessions.userId, user.id),
        eq(readingSessions.lessonSlug, slug),
        isNull(readingSessions.endedAt});
      ));

    checkAndAwardBadges(user.id, db).catch(e => console.error('Badge check error:', e));
  }

  return createSuccessResponse({ ok: true });
};
