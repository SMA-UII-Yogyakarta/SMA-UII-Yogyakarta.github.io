import type { APIRoute } from 'astro';
import { db } from '@db';
import { memberTracks } from '@db/schema';
import { eq } from 'drizzle-orm';
import { createErrorResponse, createSuccessResponse } from '@lib/api-utils';

export const GET: APIRoute = async ({ locals }) => {
  const { user } = locals;
  if (!user || user.role !== 'maintainer') {
    return createErrorResponse('Forbidden', 403);
  }

  try {
    const allUsers = await db.query.users.findMany();
    const pendingUsers = allUsers.filter(u => u.status === 'pending');
    const activeUsers = allUsers.filter(u => u.status === 'active');

    const pendingWithTracks = await Promise.all(
      pendingUsers.map(async (u) => {
        const tracks = await db.query.memberTracks.findMany({ where: eq(memberTracks.userId, u.id) });
        return { ...u, tracks: tracks.map(t => t.track) };
      })
    );

    return createSuccessResponse({
      user,
      stats: {
        pendingApproval: pendingUsers.length,
        activeMembers: activeUsers.length,
        allUsers: allUsers.length,
      },
      pendingUsers: pendingWithTracks,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};
