import { db } from '@smauii/db';
import { users, memberTracks } from '@smauii/db';
import { eq, inArray, sql } from 'drizzle-orm';
import type { APIRoute } from 'astro';
import { createErrorResponse, createSuccessResponse } from '@smauii/shared';

export const GET: APIRoute = async ({ url }) => {
  try {
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '12', 10)));
    const offset = (page - 1) * limit;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.status, 'active'));
    const total = countResult[0]?.count ?? 0;

    const membersData = await db
      .select({
        id: users.id,
        name: users.name,
        class: users.class,
        role: users.role,
        joinedAt: users.joinedAt,
        avatarUrl: users.avatarUrl,
      )
      .from(users)
      .where(eq(users.status, 'active'))
      .orderBy(users.joinedAt)
      .limit(limit)
      .offset(offset);

    if (membersData.length === 0) {
      return createSuccessResponse({ data: [], total, page, limit });
    }

    const memberIds = membersData.map((m) => m.id);

    const tracksData = await db
      .select({
        userId: memberTracks.userId,
        track: memberTracks.track,
      )
      .from(memberTracks)
      .where(inArray(memberTracks.userId, memberIds));

    const tracksByUser = new Map<string, string[]>();
    for (const t of tracksData) {
      const existing = tracksByUser.get(t.userId);
      if (existing) {
        existing.push(t.track);
      } else {
        tracksByUser.set(t.userId, [t.track]);
      }
    }

    const data = membersData.map((m) => ({
      ...m,
      tracks: tracksByUser.get(m.id) ?? [],
    }));

    return createSuccessResponse({ data, total, page, limit });
  } catch (error) {
    console.error('Failed to fetch public members:', error);
    return createErrorResponse('Failed to fetch members', 500);
  }
};
