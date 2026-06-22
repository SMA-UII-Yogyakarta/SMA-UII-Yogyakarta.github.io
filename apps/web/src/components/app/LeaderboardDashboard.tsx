import React, { useEffect, useState } from 'react';
import { apiFetch, getCachedData } from '../../lib/api-client';

interface LeaderboardUser {
  rank: number;
  id: string;
  name: string;
  avatarUrl: string | null;
  class: string;
  badgeScore: number;
}

interface RecentBadge {
  userId: string;
  userName: string;
  badgeName: string;
  badgeIcon: string;
  badgeTier: string;
  awardedAt: number;
}

interface BadgeInfo {
  id: string;
  name: string;
  icon: string;
  tier: string;
}

interface LeaderboardData {
  leaderboard: LeaderboardUser[];
  allBadges: BadgeInfo[];
  recentBadges: RecentBadge[];
}

interface LeaderboardDashboardProps {
  initialData?: LeaderboardData | null;
}

export default function LeaderboardDashboard({ initialData }: LeaderboardDashboardProps) {
  const cachedRaw = getCachedData<any>('/api/leaderboard?limit=50');
  const cachedLeaderboard: LeaderboardData | null = cachedRaw?.data?.leaderboard ? { leaderboard: cachedRaw.data.leaderboard, allBadges: cachedRaw.data.allBadges || [], recentBadges: cachedRaw.data.recentBadges || [] } : null;
  const [data, setData] = useState<LeaderboardData | null>(cachedLeaderboard ?? initialData ?? null);
  const [loading, setLoading] = useState(!cachedLeaderboard && !initialData);

  useEffect(() => {
    if (!initialData) {
      loadLeaderboardData();
    } else {
      setLoading(false);
    }
  }, [initialData]);

  const loadLeaderboardData = async () => {
    if (!cachedLeaderboard) setLoading(true);
    try {
      const res = await apiFetch<any>('/api/leaderboard?limit=50');
      // Hono API returns { leaderboard, allBadges, recentBadges } directly under data or root
      const payload = res.data || res;
      if (payload && payload.leaderboard) {
        setData({
          leaderboard: payload.leaderboard,
          allBadges: payload.allBadges || [],
          recentBadges: payload.recentBadges || [],
        });
      }
    } catch (e) {
      console.error('Failed to load leaderboard:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl h-96"></div>
        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl h-48"></div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl h-48"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-red-400">Gagal memuat leaderboard. Silakan coba lagi.</div>;
  }

  const tierColors: Record<string, string> = {
    bronze: 'text-amber-600 bg-amber-600/20',
    silver: 'text-gray-400 bg-gray-400/20',
    gold: 'text-yellow-400 bg-yellow-400/20',
    diamond: 'text-cyan-400 bg-cyan-400/20',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Top Contributors List */}
      <div className="lg:col-span-2">
        <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h3 className="font-semibold text-sm text-gray-200">Top Contributors</h3>
          </div>
          <div className="divide-y divide-gray-850">
            {data.leaderboard.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 text-sm">Belum ada data leaderboard</p>
                <p className="text-gray-600 text-xs mt-1">Mulai log aktivitas untuk masuk leaderboard!</p>
              </div>
            ) : (
              data.leaderboard.map((user, index) => {
                const initial = user.name.charAt(0).toUpperCase() || '?';
                return (
                  <div key={user.id} className="flex items-center gap-4 p-4 hover:bg-gray-800/25 transition duration-300">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0
                      ${index === 0 ? 'bg-yellow-500 text-gray-900' : ''}
                      ${index === 1 ? 'bg-gray-400 text-gray-900' : ''}
                      ${index === 2 ? 'bg-amber-650 text-white' : ''}
                      ${index > 2 ? 'bg-gray-800/60 text-gray-400' : ''}`}>
                      {index + 1}
                    </div>

                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-gray-800 flex items-center justify-center">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-bold text-gray-300 text-sm">{initial}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-200 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.class}</p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-sm text-blue-400">{user.badgeScore}</p>
                      <p className="text-[10px] text-gray-500">points</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Panel */}
      <div className="space-y-6">
        {/* Recent Badges */}
        <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6">
          <h3 className="font-semibold text-sm text-gray-200 mb-4">Recent Badges</h3>
          {data.recentBadges.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">Belum ada badge baru</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.recentBadges.map((b, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-2xl shrink-0">{b.badgeIcon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-200 truncate">{b.userName}</p>
                    <p className="text-xs text-gray-500 truncate">{b.badgeName}</p>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${tierColors[b.badgeTier] || 'bg-gray-800 text-gray-400'}`}>
                    {b.badgeTier.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Badges */}
        <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6">
          <h3 className="font-semibold text-sm text-gray-200 mb-4">All Badges ({data.allBadges.length})</h3>
          {data.allBadges.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">Belum ada badge</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {data.allBadges.map((badge) => (
                <div key={badge.id} className="flex flex-col items-center p-2 rounded-lg bg-gray-950/60 border border-gray-900/50" title={badge.name}>
                  <span className="text-2xl">{badge.icon}</span>
                  <span className={`text-[9px] mt-1 px-1 py-0.5 rounded font-bold ${tierColors[badge.tier] || ''}`}>
                    {badge.tier.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
