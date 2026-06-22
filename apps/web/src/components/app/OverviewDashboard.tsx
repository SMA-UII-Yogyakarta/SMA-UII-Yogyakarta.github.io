import React, { useEffect, useState } from 'react';
import { apiFetch, getCachedData, isExternalApiMode, getApiBaseUrl } from '../../lib/api-client';

interface User {
  id?: string;
  name?: string;
  role?: string;
  status?: string;
  class?: string;
}

interface TrackPopularity {
  track: string;
  count: number;
}

interface RecentMember {
  id: string;
  name: string;
  class: string;
  status: string;
  joinedAt: number;
}

interface PendingUser {
  id: string;
  name: string;
  class: string;
  tracks: string[];
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

interface AdminData {
  members: { total: number; active: number; pending: number; inactive: number };
  activitiesThisMonth: number;
  totalProjects: number;
  trackPopularity: TrackPopularity[];
  recentMembers: RecentMember[];
  pendingUsers: PendingUser[];
  announcements: Announcement[];
}

interface OverviewDashboardProps {
  initialUser?: User;
  initialAdminData?: AdminData | null;
}

export default function OverviewDashboard({ initialUser, initialAdminData }: OverviewDashboardProps) {
  const cachedStats = getCachedData<any>('/api/admin/stats');
  const cachedAnn = getCachedData<any>('/api/announcements');
  let cachedAdminData: AdminData | null = null;
  if (cachedStats?.data) {
    const s = cachedStats.data;
    const a = cachedAnn?.data?.announcements || cachedAnn?.data || [];
    cachedAdminData = {
      members: s.members || { total: 0, active: 0, pending: 0, inactive: 0 },
      activitiesThisMonth: s.activitiesThisMonth || 0,
      totalProjects: s.totalProjects || 0,
      trackPopularity: s.trackPopularity || [],
      recentMembers: s.recentMembers || [],
      pendingUsers: s.pendingUsers || [],
      announcements: (Array.isArray(a) ? a : []).slice(0, 3),
    };
  }
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [adminData, setAdminData] = useState<AdminData | null>(cachedAdminData ?? initialAdminData ?? null);
  const [loading, setLoading] = useState(!cachedAdminData && !initialAdminData);
  const [actionLoading, setActionLoading] = useState<Record<string, 'approve' | 'reject' | null>>({});

  useEffect(() => {
    // 1. Sync user client-side if not provided (SSG Mode)
    if (!initialUser) {
      const meta = document.getElementById('dashboard-meta');
      if (meta && meta.dataset.username) {
        setUser({
          id: meta.dataset.userId,
          name: meta.dataset.username,
          role: meta.dataset.role,
          status: meta.dataset.status,
        });
      }

      const handleUser = (e: any) => {
        setUser(e.detail);
      };
      window.addEventListener('user-loaded', handleUser);
      return () => window.removeEventListener('user-loaded', handleUser);
    }
  }, [initialUser]);

  useEffect(() => {
    // 2. Fetch admin dashboard data if user is maintainer (SSG Mode)
    if (user?.role === 'maintainer' && !initialAdminData) {
      loadAdminData();
    } else {
      setLoading(false);
    }
  }, [user, initialAdminData]);

  const loadAdminData = async () => {
    if (!cachedAdminData) setLoading(true);
    try {
      const [statsRes, annRes] = await Promise.all([
        apiFetch<any>('/api/admin/stats'),
        apiFetch<any>('/api/announcements'),
      ]);

      if (statsRes.data) {
        const stats = statsRes.data;
        const announcements = annRes.data?.announcements || annRes.data || [];
        setAdminData({
          members: stats.members || { total: 0, active: 0, pending: 0, inactive: 0 },
          activitiesThisMonth: stats.activitiesThisMonth || 0,
          totalProjects: stats.totalProjects || 0,
          trackPopularity: stats.trackPopularity || [],
          recentMembers: stats.recentMembers || [],
          pendingUsers: stats.pendingUsers || [],
          announcements: announcements.slice(0, 3),
        });
      }
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId: string, action: 'approve' | 'reject') => {
    const confirmMsg = action === 'approve' ? 'Setujui anggota ini?' : 'Tolak dan hapus anggota ini?';
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(prev => ({ ...prev, [userId]: action }));

    try {
      const res = await apiFetch<any>('/api/admin/approve', {
        method: 'POST',
        body: JSON.stringify({ userId, action }),
      });

      if (res.error) {
        alert('Gagal memproses: ' + res.error);
        loadAdminData(); // reload to sync
      } else {
        // Optimistic update client-side
        if (adminData) {
          setAdminData({
            ...adminData,
            pendingUsers: adminData.pendingUsers.filter(u => u.id !== userId),
            members: {
              ...adminData.members,
              pending: adminData.members.pending - 1,
              active: action === 'approve' ? adminData.members.active + 1 : adminData.members.active,
            }
          });
        }
      }
    } catch (e) {
      console.error(e);
      alert('Terjadi kesalahan');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: null }));
    }
  };

  if (!user) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-800 rounded w-1/4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 h-24"></div>
          ))}
        </div>
      </div>
    );
  }

  const isMaintainer = user.role === 'maintainer';
  const isActive = user.status === 'active';

  if (isMaintainer) {
    if (loading) {
      return (
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 h-28"></div>
            ))}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl h-24"></div>
            ))}
          </div>
        </div>
      );
    }

    if (!adminData) {
      return <div className="text-red-400">Gagal memuat data dashboard. Silakan coba lagi.</div>;
    }

    const maxTrackCount = adminData.trackPopularity.length > 0 ? adminData.trackPopularity[0].count : 1;

    return (
      <div>
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm">Kelola komunitas Digital Lab SMA UII</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-5 hover:border-gray-700/60 transition duration-300">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">👥</span>
              <span className="text-xs text-gray-400 font-semibold">Total Members</span>
            </div>
            <p className="text-2xl font-bold text-gray-100">{adminData.members.total}</p>
            <p className="text-xs text-gray-500 mt-1">{adminData.members.pending} pending · {adminData.members.inactive} inactive</p>
          </div>

          <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-5 hover:border-gray-700/60 transition duration-300">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">✅</span>
              <span className="text-xs text-gray-400 font-semibold">Active</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{adminData.members.active}</p>
            <p className="text-xs text-gray-500 mt-1">Anggota aktif</p>
          </div>

          <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-5 hover:border-gray-700/60 transition duration-300">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📊</span>
              <span className="text-xs text-gray-400 font-semibold">Activities</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">{adminData.activitiesThisMonth}</p>
            <p className="text-xs text-gray-500 mt-1">Bulan ini</p>
          </div>

          <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-5 hover:border-gray-700/60 transition duration-300">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🚀</span>
              <span className="text-xs text-gray-400 font-semibold">Projects</span>
            </div>
            <p className="text-2xl font-bold text-purple-400">{adminData.totalProjects}</p>
            <p className="text-xs text-gray-500 mt-1">Total proyek</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <a href="/app/members" className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-5 hover:border-blue-500/60 transition duration-300 block group relative overflow-hidden">
            <div className="text-3xl mb-2 group-hover:scale-110 transition duration-300 inline-block">👥</div>
            <p className="font-bold text-sm text-gray-200 group-hover:text-blue-400 transition-colors">Members</p>
            <p className="text-xs text-gray-500 mt-0.5">Kelola anggota</p>
          </a>
          <a href="/app/projects" className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-5 hover:border-blue-500/60 transition duration-300 block group relative overflow-hidden">
            <div className="text-3xl mb-2 group-hover:scale-110 transition duration-300 inline-block">🚀</div>
            <p className="font-bold text-sm text-gray-200 group-hover:text-blue-400 transition-colors">Projects</p>
            <p className="text-xs text-gray-500 mt-0.5">Galeri proyek</p>
          </a>
          <a href="/app/activities" className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-5 hover:border-blue-500/60 transition duration-300 block group relative overflow-hidden">
            <div className="text-3xl mb-2 group-hover:scale-110 transition duration-300 inline-block">📅</div>
            <p className="font-bold text-sm text-gray-200 group-hover:text-blue-400 transition-colors">Activities</p>
            <p className="text-xs text-gray-500 mt-0.5">Log kegiatan</p>
          </a>
          <a href="/app/announcements" className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-5 hover:border-blue-500/60 transition duration-300 block group relative overflow-hidden">
            <div className="text-3xl mb-2 group-hover:scale-110 transition duration-300 inline-block">📢</div>
            <p className="font-bold text-sm text-gray-200 group-hover:text-blue-400 transition-colors">Announce</p>
            <p className="text-xs text-gray-500 mt-0.5">Buat pengumuman</p>
          </a>
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6">
            <h2 className="font-bold text-base mb-4 text-gray-200">Popularitas Track</h2>
            <div className="space-y-4">
              {adminData.trackPopularity.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-6">Belum ada data track</p>
              ) : (
                adminData.trackPopularity.map((t, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-24 shrink-0 truncate" title={t.track}>{t.track}</span>
                    <div className="flex-1 bg-gray-800 rounded-full h-3.5 overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(2, Math.round((t.count / maxTrackCount) * 100))}%` }}></div>
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-right font-mono">{t.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6">
            <h2 className="font-bold text-base mb-4 text-gray-200">Aktivitas Bulan Ini</h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-400">Total aktivitas yang tercatat bulan ini: <span className="font-bold text-white">{adminData.activitiesThisMonth}</span></p>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full w-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Updates Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-base text-gray-200">Anggota Terbaru</h2>
              <a href="/app/members" className="text-blue-400 text-xs hover:text-blue-300 font-semibold">Lihat semua →</a>
            </div>
            <div className="space-y-2">
              {adminData.recentMembers.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-6">Belum ada anggota baru</p>
              ) : (
                adminData.recentMembers.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                    <span className="text-sm">{m.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        {new Date(m.joinedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${m.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {m.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-base text-gray-200">Pengumuman Terbaru</h2>
              <a href="/app/announcements" className="text-blue-400 text-xs hover:text-blue-300 font-semibold">Lihat semua →</a>
            </div>
            <div className="space-y-2">
              {adminData.announcements.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-6">Belum ada pengumuman</p>
              ) : (
                adminData.announcements.map((a, idx) => (
                  <div key={idx} className="py-2 border-b border-gray-800 last:border-0">
                    <p className="font-medium text-sm text-gray-200">{a.title}</p>
                    <p className="text-xs text-gray-400 truncate">{a.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-base text-gray-200">Menunggu Persetujuan ({adminData.pendingUsers.length})</h2>
            {adminData.pendingUsers.length > 5 && (
              <a href="/app/members?status=pending" className="text-blue-400 text-xs hover:text-blue-300 font-semibold">Lihat semua →</a>
            )}
          </div>
          <div className="space-y-3">
            {adminData.pendingUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">Tidak ada pendaftaran baru</p>
              </div>
            ) : (
              adminData.pendingUsers.map((u, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-950 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-white">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.class} · {(u.tracks || []).join(', ')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(u.id, 'approve')}
                      disabled={actionLoading[u.id] !== null}
                      className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-3 py-1 rounded text-xs transition"
                    >
                      {actionLoading[u.id] === 'approve' ? 'Approving...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleAction(u.id, 'reject')}
                      disabled={actionLoading[u.id] !== null}
                      className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white px-3 py-1 rounded text-xs transition"
                    >
                      {actionLoading[u.id] === 'reject' ? 'Rejecting...' : 'Reject'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // Member Dashboard UI
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-bold">Halo, {user.name}! 👋</h1>
        <p className="text-gray-400 text-sm">Member dashboard</p>
      </div>

      {!isActive && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-5 mb-6 flex items-center gap-4">
          <span className="text-2xl">⏳</span>
          <div>
            <p className="font-bold text-yellow-400 text-sm">Menunggu Persetujuan</p>
            <p className="text-xs text-gray-400 mt-0.5">Pendaftaranmu sedang ditinjau oleh maintainer</p>
          </div>
        </div>
      )}

      {/* Grid Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <a href="/app/profile" className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-5 hover:border-blue-500/60 transition duration-300 block group relative overflow-hidden">
          <div className="text-3xl mb-2 group-hover:scale-110 transition duration-300 inline-block">👤</div>
          <p className="font-bold text-sm text-gray-200 group-hover:text-blue-400 transition-colors">Profile</p>
          <p className="text-xs text-gray-500 mt-0.5">Akun kamu</p>
        </a>

        {isActive && (
          <>
            <a href="/app/card" className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-5 hover:border-blue-500/60 transition duration-300 block group relative overflow-hidden">
              <div className="text-3xl mb-2 group-hover:scale-110 transition duration-300 inline-block">🎫</div>
              <p className="font-bold text-sm text-gray-200 group-hover:text-blue-400 transition-colors">Kartu Anggota</p>
              <p className="text-xs text-gray-500 mt-0.5">ID & QR Code</p>
            </a>
            <a href="/app/projects" className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-5 hover:border-blue-500/60 transition duration-300 block group relative overflow-hidden">
              <div className="text-3xl mb-2 group-hover:scale-110 transition duration-300 inline-block">🚀</div>
              <p className="font-bold text-sm text-gray-200 group-hover:text-blue-400 transition-colors">Projects</p>
              <p className="text-xs text-gray-500 mt-0.5">Showcase karyamu</p>
            </a>
            <a href="/app/activities" className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-5 hover:border-blue-500/60 transition duration-300 block group relative overflow-hidden">
              <div className="text-3xl mb-2 group-hover:scale-110 transition duration-300 inline-block">📊</div>
              <p className="font-bold text-sm text-gray-200 group-hover:text-blue-400 transition-colors">Activities</p>
              <p className="text-xs text-gray-500 mt-0.5">Log kontribusi</p>
            </a>
          </>
        )}
      </div>

      <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6">
        <h2 className="font-bold text-base mb-4 text-gray-200">Status Akun</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <div className="bg-gray-950/60 border border-gray-900/50 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Status</p>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              {(user.status || '').toUpperCase()}
            </span>
          </div>
          <div className="bg-gray-950/60 border border-gray-900/50 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Role</p>
            <p className="text-sm font-medium capitalize text-gray-200">{user.role || 'member'}</p>
          </div>
          <div className="bg-gray-950/60 border border-gray-900/50 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Kelas</p>
            <p className="text-sm font-medium text-gray-200">{user.class || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
