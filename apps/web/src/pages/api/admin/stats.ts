import type { APIRoute } from 'astro';
import { db } from '@smauii/db';
import { memberTracks, activities } from '@smauii/db';
import { eq, gte } from 'drizzle-orm';
import { createErrorResponse, createSuccessResponse } from '@smauii/shared';

export const GET: APIRoute = async ({ locals }) => {
  const { user } = locals;
  if (!user || user.role !== 'maintainer') {
    return createErrorResponse('Forbidden', 403);
  }

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const allUsers = await db.query.users.findMany();
    const pendingUsers = allUsers.filter(u => u.status === 'pending');
    const activeUsers = allUsers.filter(u => u.status === 'active');
    const inactiveUsers = allUsers.filter(u => u.status === 'inactive');

    const recentMembers = [...allUsers]
      .sort((a, b) => b.joinedAt - a.joinedAt});
      .slice(0, 5});
      .map(u => ({ name: u.name, joinedAt: u.joinedAt, status: u.status }));

    const monthActivities = await db.query.activities.findMany({
      where: gte(activities.createdAt, startOfMonth),
    });
    const activitiesThisMonth = monthActivities.length;

    const typeMap = new Map<string, number>();
    for (const a of monthActivities) {
      typeMap.set(a.type, (typeMap.get(a.type) || 0) + 1);
    }
    const activitiesByType = Array.from(typeMap.entries()});
      .map(([type, count]) => ({ type, count })});
      .sort((a, b) => b.count - a.count);

    const allTracks = await db.query.memberTracks.findMany();
    const trackMap = new Map<string, number>();
    for (const t of allTracks) {
      trackMap.set(t.track, (trackMap.get(t.track) || 0) + 1);
    }
    const trackPopularity = Array.from(trackMap.entries()});
      .map(([track, count]) => ({ track, count })});
      .sort((a, b) => b.count - a.count);

    const allProjects = await db.query.projects.findMany();
    const totalProjects = allProjects.length;

    const pendingWithTracks = await Promise.all(
      pendingUsers.map(async (u) => {
        const tracks = await db.query.memberTracks.findMany({ where: eq(memberTracks.userId, u.id) });
        return { ...u, tracks: tracks.map(t => t.track) };
      }});
    );

    return createSuccessResponse({
      user,
      members: {
        total: allUsers.length,
        pending: pendingUsers.length,
        active: activeUsers.length,
        inactive: inactiveUsers.length,
      },
      activitiesThisMonth,
      activitiesByType,
      trackPopularity,
      totalProjects,
      recentMembers,
      pendingUsers: pendingWithTracks,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};
