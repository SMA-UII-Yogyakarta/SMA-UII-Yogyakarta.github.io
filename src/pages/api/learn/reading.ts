import type { APIRoute } from 'astro';
import { db } from '@smauii/db';
import { readingSessions } from '@smauii/db';
import { eq, and, isNull } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { readingSessionSchema } from '@smauii/validation';

// POST — mulai atau akhiri sesi baca
export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(null, { status: 401 });

  const body = await request.json();
  const parsed = readingSessionSchema.safeParse(body);
  if (!parsed.success) return new Response(null, { status: 400 });

  const { slug, action, duration } = parsed.data;

  if (action === 'start') {
    // Tutup sesi yang masih terbuka untuk lesson ini
    await db.update(readingSessions)
      .set({ endedAt: Date.now(), duration: 0 })
      .where(and(
        eq(readingSessions.userId, user.id),
        eq(readingSessions.lessonSlug, slug),
        isNull(readingSessions.endedAt)
      ));

    await db.insert(readingSessions).values({
      id: nanoid(),
      userId: user.id,
      lessonSlug: slug,
      startedAt: Date.now(),
    });
  }

  if (action === 'end' && duration != null) {
    await db.update(readingSessions)
      .set({ endedAt: Date.now(), duration })
      .where(and(
        eq(readingSessions.userId, user.id),
        eq(readingSessions.lessonSlug, slug),
        isNull(readingSessions.endedAt)
      ));
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
