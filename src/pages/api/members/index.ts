import { db } from '@db';
import { users, memberTracks } from '@db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { APIRoute } from 'astro';
import { createErrorResponse, createSuccessResponse } from '@lib/api-utils';

export const GET: APIRoute = async ({ locals, url }) => {
  const { session, user } = locals;
  if (!session || !user || user.role !== 'maintainer') return createErrorResponse('Forbidden', 403);

  try {
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const conditions = [];
    if (status) conditions.push(eq(users.status, status));
    if (search) conditions.push(sql`(${users.name} LIKE ${'%' + search + '%'} OR ${users.email} LIKE ${'%' + search + '%'} OR ${users.nisn} LIKE ${'%' + search + '%'})`);
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const allUsers = await db
      .select({
        id: users.id, name: users.name, email: users.email, nisn: users.nisn,
        nis: users.nis, class: users.class, role: users.role, status: users.status,
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
    console.error('Failed to fetch members:', error);
    return createErrorResponse('Failed to fetch members', 500);
  }
};
