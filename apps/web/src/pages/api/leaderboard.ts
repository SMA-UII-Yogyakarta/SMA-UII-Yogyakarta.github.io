import type { APIRoute } from 'astro';
import { db } from '@smauii/db';
import { getLeaderboard } from '@smauii/db/badges';
import { createSuccessResponse, createErrorResponse } from '@smauii/shared';

export const GET: APIRoute = async ({ url }) => {
  try {
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const leaderboard = await getLeaderboard(db, limit);

    const ranked = leaderboard.map((user: { id: string; name: string; avatarUrl: string | null; class: string; badgeScore: number }, index: number) => ({
      rank: index + 1,
      ...user,
    }));

    return createSuccessResponse({
      total: ranked.length,
      leaderboard: ranked,
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return createErrorResponse('Failed to fetch leaderboard', 500);
  }
};
