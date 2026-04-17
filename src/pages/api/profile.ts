import { db } from '@db';
import { users, memberTracks, memberCards } from '@db/schema';
import { eq } from 'drizzle-orm';
import type { APIRoute } from 'astro';
import { createErrorResponse, createSuccessResponse } from '@lib/api-utils';

export const GET: APIRoute = async ({ locals }) => {
  const { user: sessionUser } = locals;
  if (!sessionUser) return createErrorResponse('Unauthorized', 401);

  try {
    const userData = await db
      .select({
        id: users.id, nisn: users.nisn, nis: users.nis, name: users.name,
        email: users.email, githubUsername: users.githubUsername, class: users.class,
        role: users.role, status: users.status, joinedAt: users.joinedAt,
        approvedAt: users.approvedAt, cardNumber: memberCards.cardNumber,
        cardQrCode: memberCards.qrCode, cardIssuedAt: memberCards.issuedAt,
      })
      .from(users)
      .leftJoin(memberCards, eq(users.id, memberCards.userId))
      .where(eq(users.id, sessionUser.id))
      .limit(1);

    if (userData.length === 0) return createErrorResponse('User not found', 404);

    const tracks = await db.select({ track: memberTracks.track })
      .from(memberTracks)
      .where(eq(memberTracks.userId, sessionUser.id));

    return createSuccessResponse({ ...userData[0], tracks: tracks.map(t => t.track) });
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return createErrorResponse('Failed to fetch profile', 500);
  }
};

export const PATCH: APIRoute = async ({ locals, request }) => {
  const { user: sessionUser } = locals;
  if (!sessionUser) return createErrorResponse('Unauthorized', 401);

  try {
    const { name, githubUsername } = await request.json();
    if (name) await db.update(users).set({ name }).where(eq(users.id, sessionUser.id));
    if (githubUsername !== undefined) await db.update(users).set({ githubUsername }).where(eq(users.id, sessionUser.id));
    return createSuccessResponse({ success: true });
  } catch (error) {
    console.error('Failed to update profile:', error);
    return createErrorResponse('Failed to update profile', 500);
  }
};
