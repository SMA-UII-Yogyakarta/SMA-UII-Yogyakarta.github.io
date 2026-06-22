import type { APIRoute } from 'astro';
import { db } from '@smauii/db';
import { users, badges, userBadges } from '@smauii/db';
import { createSuccessResponse, createErrorResponse } from '@smauii/shared';
import { desc, eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ url }) => {
  try {
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    
    const [leaderboardList, allBadgesList, recentBadgesList] = await Promise.all([
      db.select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
        class: users.class,
        badgeScore: users.badgeScore,
      })
        .from(users)
        .where(eq(users.status, 'active'))
        .orderBy(desc(users.badgeScore))
        .limit(limit),

      db.select().from(badges),

      db.select({
        userId: userBadges.userId,
        userName: users.name,
        badgeName: badges.name,
        badgeIcon: badges.icon,
        badgeTier: badges.tier,
        awardedAt: userBadges.awardedAt,
      })
        .from(userBadges)
        .innerJoin(users, eq(userBadges.userId, users.id))
        .innerJoin(badges, eq(userBadges.badgeId, badges.id))
        .orderBy(desc(userBadges.awardedAt))
        .limit(10)
    ]);

    const ranked = leaderboardList.map((user, index) => ({
      rank: index + 1,
      ...user,
    }));

    return createSuccessResponse({
      leaderboard: ranked,
      allBadges: allBadgesList,
      recentBadges: recentBadgesList
    });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return createErrorResponse('Failed to fetch leaderboard', 500);
  }
};
