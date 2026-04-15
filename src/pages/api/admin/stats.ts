import type { APIRoute } from 'astro';
import { lucia } from '@lib/auth';
import { db } from '@db';
import { users, memberTracks } from '@db/schema';
import { eq } from 'drizzle-orm';
import { createErrorResponse, createSuccessResponse } from '@lib/api-utils';

export const GET: APIRoute = async ({ cookies }) => {
  const sessionId = cookies.get(lucia.sessionCookieName)?.value ?? null;
  
  if (!sessionId) {
    return createErrorResponse('Unauthorized', 401);
  }

  try {
    const { session, user } = await lucia.validateSession(sessionId);
    
    if (!session || !user) {
      return createErrorResponse('Unauthorized', 401);
    }

    if (user.role !== 'maintainer') {
      return createErrorResponse('Forbidden', 403);
    }

    // Get stats
    const allUsers = await db.query.users.findMany();
    const pendingUsers = allUsers.filter(u => u.status === 'pending');
    const activeUsers = allUsers.filter(u => u.status === 'active');

    // Get pending users with their tracks
    const pendingWithTracks = await Promise.all(
      pendingUsers.map(async (u) => {
        const tracks = await db.query.memberTracks.findMany({
          where: eq(memberTracks.userId, u.id),
        });
        return {
          ...u,
          tracks: tracks.map(t => t.track),
        };
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
    console.error('Admin API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};
