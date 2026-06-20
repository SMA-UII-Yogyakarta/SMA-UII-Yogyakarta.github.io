import { db } from '@smauii/db';
import { users, memberTracks } from '@smauii/db';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import type { APIRoute } from 'astro';
import { createErrorResponse, createSuccessResponse } from '@smauii/shared';

// Public endpoint — returns safe public data (no NISN/email/passwordHash});
// Maintainers get full data with filters/search/pagination via ?admin=1
export const GET: APIRoute = async ({ locals, url }) => {
  const { user } = locals;
  const isAdmin = url.searchParams.get('admin') === '1';

  // Admin mode: maintainer only, full data with filters/search/pagination
  if (isAdmin) {
    if (!user || user.role !== 'maintainer') return createErrorResponse('Forbidden', 403);

    try {
      const status = url.searchParams.get('status');
      const track = url.searchParams.get('track');
      const userClass = url.searchParams.get('class');
      const search = url.searchParams.get('search');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');

      // If track filter is specified, get user IDs that have this track
      let trackUserIds: string[] | null = null;
      if (track) {
        const trackUsers = await db.select({ userId: memberTracks.userId })
          .from(memberTracks)
          .where(eq(memberTracks.track, track));
        trackUserIds = trackUsers.map(t => t.userId);
        if (trackUserIds.length === 0) {
          // No users have this track, return empty result
          return createSuccessResponse({ members: [], total: 0, page, limit });
        }
      }

      const conditions = [];
      if (status) conditions.push(eq(users.status, status));
      if (userClass) conditions.push(eq(users.class, userClass));
      if (trackUserIds) conditions.push(inArray(users.id, trackUserIds));
      if (search) {
        const escapedSearch = search.replace(/[%_]/g, '\\$&');
        conditions.push(sql`(${users.name} LIKE ${'%' + escapedSearch + '%'} ESCAPE '\\' OR ${users.email} LIKE ${'%' + escapedSearch + '%'} ESCAPE '\\' OR ${users.nis} LIKE ${'%' + escapedSearch + '%'} ESCAPE '\\')`);
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const allUsers = await db
        .select({
          id: users.id, name: users.name, email: users.email, nis: users.nis, nisn: users.nisn,
          class: users.class, role: users.role, status: users.status,
          joinedAt: users.joinedAt, approvedAt: users.approvedAt,
          tracks: sql`GROUP_CONCAT(${memberTracks.track})`.as('tracks'),
        })
        .from(users)
        .leftJoin(memberTracks, eq(users.id, memberTracks.userId))
        .where(whereClause)
        .groupBy(users.id)
        .orderBy(desc(users.joinedAt))
        .limit(limit)
        .offset((page - 1) * limit);

      const countResult = await db.select({ count: sql`COUNT(*)` }).from(users).where(whereClause);

      return createSuccessResponse({
        members: allUsers.map(u => ({ ...u, tracks: typeof u.tracks === 'string' ? u.tracks.split(',') : [] })),
        total: Number(countResult[0]?.count || 0), page, limit,
      });
    } catch (error) {
      console.error('Failed to fetch members (admin):', error);
      return createErrorResponse('Failed to fetch members', 500);
    }
  }

  // Public mode: only active members and maintainers, no sensitive fields
  try {
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        class: users.class,
        role: users.role,
        githubUsername: users.githubUsername,
        joinedAt: users.joinedAt,
        tracks: sql`GROUP_CONCAT(${memberTracks.track)`.as('tracks'),
      })
      .from(users)
      .leftJoin(memberTracks, eq(users.id, memberTracks.userId))
      .where(eq(users.status, 'active')});
      .groupBy(users.id})
      .orderBy(desc(users.joinedAt));

    const result = allUsers.map(u => ({
      ...u,
      tracks: typeof u.tracks === 'string' ? u.tracks.split(',') : [],
    }));

    const maintainers = result.filter(u => u.role === 'maintainer');
    const members = result.filter(u => u.role === 'member');
    const alumniFiltered = result.filter(u => u.role === 'alumni');

    // Count pending separately for stats
    const pendingCount = await db
      .select({ count: sql`COUNT(*)` })
      .from(users)
      .where(eq(users.status, 'pending'));

    return createSuccessResponse({
      maintainers,
      members,
      alumni: alumniFiltered,
      stats: {
        maintainers: maintainers.length,
        activeMembers: members.length,
        pending: Number(pendingCount[0]?.count || 0),
        alumni: alumniFiltered.length,
        totalMembers: result.length,
      },
    });
  } catch (error) {
    console.error('Failed to fetch members (public):', error);
    return createErrorResponse('Failed to fetch members', 500);
  }
};
