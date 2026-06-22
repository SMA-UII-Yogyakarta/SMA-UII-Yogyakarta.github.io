import React, { useEffect, useState, useRef } from 'react';
import { apiFetch } from '../../lib/api-client';

interface UserBadge {
  id: string;
  awardedAt: number;
  badge: {
    id: string;
    name: string;
    description: string;
    icon: string;
    tier: string;
    category: string;
    points: number;
  };
}

interface ProfileData {
  id: string;
  nis: string;
  nisn: string | null;
  name: string;
  email: string;
  githubUsername: string | null;
  avatarUrl: string | null;
  class: string;
  role: string;
  status: string;
  badgeScore: number;
  joinedAt: number;
  card: { cardNumber: string; qrCode: string; issuedAt: number } | null;
  tracks: string[];
  badges: UserBadge[];
  approver?: { name: string } | null;
}

interface GitHubStats {
  commits: number;
  pullRequests: number;
  issues: number;
}

interface GitHubData {
  hasGitHub: boolean;
  valid: boolean;
  message?: string;
  stats: GitHubStats;
  topRepos: string[];
}

interface ProfileDashboardProps {
  initialData?: ProfileData | null;
}

export default function ProfileDashboard({ initialData }: ProfileDashboardProps) {
  const [data, setData] = useState<ProfileData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [githubData, setGitHubData] = useState<GitHubData | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!initialData) {
      loadProfileData();
    } else {
      setLoading(false);
    }
  }, [initialData]);

  useEffect(() => {
    if (data?.githubUsername) {
      loadGitHubContributions();
    }
  }, [data]);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<ProfileData>('/api/profile');
      if (res.data) {
        setData(res.data);
      }
    } catch (e) {
      console.error('Failed to load profile data:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadGitHubContributions = async () => {
    try {
      const res = await apiFetch<GitHubData>('/api/github-contributions');
      if (res.data) {
        setGitHubData(res.data);
      }
    } catch (e) {
      console.error('Failed to load GitHub contributions:', e);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setUploadStatus('File terlalu besar (maks 2MB)');
      return;
    }

    setUploading(true);
    setUploadStatus('Mengupload...');

    try {
      const fd = new FormData();
      fd.append('image', file);

      // Upload image
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Call dynamic endpoint URL if in external API mode
      const meta = document.getElementById('dashboard-meta');
      const apiUrl = meta?.dataset.apiUrl || '';

      const uploadRes = await fetch(`${apiUrl}/api/upload/image`, {
        method: 'POST',
        headers,
        body: fd,
      });

      if (!uploadRes.ok) {
        const errJson = await uploadRes.json().catch(() => ({}));
        setUploadStatus(errJson.error || 'Gagal upload');
        setUploading(false);
        return;
      }

      const uploadData = await uploadRes.json();
      const avatarUrl = uploadData.data?.url;

      if (!avatarUrl) {
        setUploadStatus('Gagal mendapatkan URL');
        setUploading(false);
        return;
      }

      // Update Profile
      const saveRes = await apiFetch<any>('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ avatarUrl }),
      });

      if (saveRes.error) {
        setUploadStatus('Gagal menyimpan profile');
      } else {
        setUploadStatus('Foto profil diperbarui');
        if (data) {
          setData({ ...data, avatarUrl });
        }
        // Reload page or let app layout know avatar changed
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (err) {
      console.error(err);
      setUploadStatus('Terjadi kesalahan');
    } finally {
      setUploading(false);
    }
  };

  const fmtDate = (timestamp: number | null) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="w-20 h-20 rounded-full bg-gray-800 shrink-0"></div>
          <div className="flex-1 space-y-2 w-full">
            <div className="h-6 bg-gray-800 rounded w-1/3"></div>
            <div className="h-4 bg-gray-800 rounded w-1/4"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl h-40"></div>
          </div>
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl h-40"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-red-400">Gagal memuat profil. Silakan coba lagi.</div>;
  }

  const initial = data.name.charAt(0).toUpperCase() || '?';
  const tierColors: Record<string, string> = {
    bronze: 'text-amber-600 bg-amber-600/20',
    silver: 'text-gray-400 bg-gray-400/20',
    gold: 'text-yellow-400 bg-yellow-400/20',
    diamond: 'text-cyan-400 bg-cyan-400/20',
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-center gap-6 bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 mb-6">
        <div className="relative group shrink-0">
          <div id="avatar-container" className="w-20 h-20 rounded-full overflow-hidden hover:ring-4 hover:ring-blue-500 transition duration-300 cursor-pointer bg-gray-850 flex items-center justify-center">
            {data.avatarUrl ? (
              <img src={data.avatarUrl} alt={data.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-bold text-3xl shrink-0">
                {initial}
              </div>
            )}
          </div>
          <button
            onClick={handleAvatarClick}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-500 text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            title="Upload photo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
        </div>

        <div className="flex-1 text-center sm:text-left min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{data.name}</h1>
          <p className="text-sm text-gray-400 mt-1">{data.class} · {data.role.toUpperCase()}</p>
          {uploadStatus && <p className="text-xs text-gray-500 mt-2">{uploadStatus}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Badge Achievements */}
          <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6">
            <h3 className="font-semibold mb-4 text-sm text-gray-400 uppercase tracking-wider">Badge Achievements</h3>
            {data.badges.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-2">🏅</div>
                <p className="text-gray-500 text-sm">Belum ada badge yang diraih</p>
                <p className="text-gray-600 text-xs mt-1">Selesaikan track pembelajaran atau proyek untuk meraih badge!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {data.badges.map((b, idx) => (
                  <div key={idx} className="flex flex-col items-center p-3 rounded-xl bg-gray-950/60 border border-gray-900/50" title={b.badge.description}>
                    <span className="text-3xl mb-1.5">{b.badge.icon}</span>
                    <span className="text-xs font-bold text-gray-200 text-center truncate w-full">{b.badge.name}</span>
                    <span className={`text-[10px] mt-1 px-1.5 py-0.5 rounded font-medium ${tierColors[b.badge.tier] || ''}`}>
                      {b.badge.tier.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* GitHub Contributions */}
          {githubData?.hasGitHub && (
            <div id="github-contributions" className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6">
              <h3 className="font-semibold mb-4 text-sm text-gray-400 uppercase tracking-wider">GitHub Contributions</h3>
              {!githubData.valid ? (
                <p className="text-gray-500 text-sm">{githubData.message}</p>
              ) : (
                <div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-400">{githubData.stats.commits}</p>
                      <p className="text-xs text-gray-500">Commits</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-400">{githubData.stats.pullRequests}</p>
                      <p className="text-xs text-gray-500">Pull Requests</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-400">{githubData.stats.issues}</p>
                      <p className="text-xs text-gray-500">Issues</p>
                    </div>
                  </div>
                  {githubData.topRepos.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Top Repositories</p>
                      <div className="flex flex-wrap gap-2">
                        {githubData.topRepos.map((r, idx) => (
                          <a
                            key={idx}
                            href={`https://github.com/${r}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2.5 py-1 bg-gray-950/60 border border-gray-800/80 rounded-lg hover:border-gray-700/80 text-gray-400 hover:text-gray-200 transition-colors"
                          >
                            {r}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Informasi Akademik */}
          <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6">
            <h3 className="font-semibold mb-4 text-sm text-gray-400 uppercase tracking-wider">Informasi Akademik</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">NIS</p>
                <p className="font-mono font-medium text-gray-200">{data.nis}</p>
              </div>
              {data.nisn && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">NISN</p>
                  <p className="font-mono font-medium text-gray-200">{data.nisn}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 mb-1">Kelas</p>
                <p className="font-medium text-gray-200">{data.class}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Role</p>
                <p className="font-medium capitalize text-gray-200">{data.role}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-1">Bergabung</p>
                <p className="font-medium text-gray-200">{fmtDate(data.joinedAt)}</p>
              </div>
            </div>
          </div>

          {/* Informasi Keanggotaan */}
          {data.status === 'active' && data.approver && (
            <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6">
              <h3 className="font-semibold mb-4 text-sm text-gray-400 uppercase tracking-wider">Informasi Keanggotaan</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-600/20 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Disetujui oleh</p>
                  <p className="font-medium text-gray-200">{data.approver.name}</p>
                </div>
              </div>
            </div>
          )}

          {/* Track Minat */}
          <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6">
            <h3 className="font-semibold mb-4 text-sm text-gray-400 uppercase tracking-wider">Track Minat</h3>
            {data.tracks.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {data.tracks.map((t, idx) => (
                  <span key={idx} className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Belum ada track minat</p>
            )}
          </div>

          {/* Kartu Anggota */}
          {data.card && (
            <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-sm text-gray-400 uppercase tracking-wider">Kartu Anggota</h3>
                <a href="/app/card" className="text-blue-400 text-xs hover:text-blue-300 font-semibold">Lihat Kartu →</a>
              </div>
              <p className="font-mono text-sm text-gray-300 truncate">{data.card.cardNumber}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
