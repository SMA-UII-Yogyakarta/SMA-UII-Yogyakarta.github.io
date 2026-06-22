import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api-client';

interface MemberDetail {
  user: {
    id: string;
    name: string;
    email: string;
    nis?: string;
    nisn?: string;
    class?: string;
    role: string;
    status: string;
    githubUsername?: string;
    githubId?: string;
    avatarUrl?: string;
    joinedAt: number;
    approvedBy?: string;
  };
  tracks: string[];
  activityCount?: number;
  projectCount?: number;
}

interface MemberDetailDashboardProps {
  id?: string;
  initialData?: MemberDetail | null;
}

export default function MemberDetailDashboard({ id, initialData }: MemberDetailDashboardProps) {
  const [member, setMember] = useState<MemberDetail | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    if (!initialData && id && id !== 'fallback') {
      loadMemberDetail();
    } else {
      setLoading(false);
    }
  }, [id, initialData]);

  useEffect(() => {
    // If the path contains the ID directly (when navigating to /app/members/[id] in pure SSG fallback)
    if (!initialData && (!id || id === 'fallback') && typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/');
      const pathId = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
      if (pathId && pathId !== 'members' && pathId !== 'fallback') {
        loadMemberDetail(pathId);
      }
    }
  }, []);

  const loadMemberDetail = async (memberId = id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<any>(`/api/admin/users?id=${memberId}`);
      if (res.error) {
        setError(res.error);
      } else if (res.data) {
        setMember(res.data);
      } else {
        setError('Member tidak ditemukan');
      }
    } catch (e) {
      console.error(e);
      setError('Gagal memuat data member');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!member) return;
    const confirmMsg = action === 'approve' ? 'Setujui anggota ini?' : 'Tolak dan hapus anggota ini?';
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(action);

    try {
      const res = await apiFetch<any>('/api/admin/approve', {
        method: 'POST',
        body: JSON.stringify({ userId: member.user.id, action }),
      });

      if (res.error) {
        alert('Gagal: ' + res.error);
      } else {
        alert(action === 'approve' ? 'Anggota berhasil disetujui' : 'Anggota berhasil ditolak');
        if (action === 'approve') {
          // Update local status
          setMember({
            ...member,
            user: { ...member.user, status: 'active' },
          });
        } else {
          // Redirect back to members
          window.location.href = '/app/members';
        }
      }
    } catch (e) {
      console.error(e);
      alert('Terjadi kesalahan');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12 animate-pulse">
        <div className="text-6xl mb-4">⏳</div>
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <p className="text-red-400 text-lg mb-4">{error || 'Member tidak ditemukan'}</p>
          <a href="/app/members" className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold transition">
            ← Kembali ke Daftar Member
          </a>
        </div>
      </div>
    );
  }

  const initial = member.user.name.charAt(0).toUpperCase() || '?';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-2xl shrink-0 overflow-hidden">
            {member.user.avatarUrl ? (
              <img src={member.user.avatarUrl} alt={member.user.name} className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white mb-1 truncate">{member.user.name}</h1>
            <p className="text-gray-400 text-sm mb-2 truncate">{member.user.email}</p>
            <div className="flex gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                member.user.status === 'active' ? 'text-green-400 bg-green-400/10' :
                member.user.status === 'pending' ? 'text-yellow-400 bg-yellow-400/10' :
                'text-red-400 bg-red-400/10'
              }`}>
                {member.user.status}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-medium text-blue-400 bg-blue-400/10 capitalize">
                {member.user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid md:grid-cols-2 gap-4 text-sm border-t border-gray-800 pt-6">
          <div className="space-y-3">
            <div>
              <p className="text-gray-500 text-xs mb-1">NISN</p>
              <p className="text-gray-200 font-medium">{member.user.nisn || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">NIS</p>
              <p className="text-gray-200 font-medium">{member.user.nis || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Kelas</p>
              <p className="text-gray-200 font-medium">{member.user.class || '-'}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-gray-500 text-xs mb-1">GitHub</p>
              <p className="text-gray-200 font-medium">
                {member.user.githubUsername ? (
                  <a href={`https://github.com/${member.user.githubUsername}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                    @{member.user.githubUsername}
                  </a>
                ) : '-'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Bergabung</p>
              <p className="text-gray-200 font-medium">
                {new Date(member.user.joinedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Disetujui Oleh</p>
              <p className="text-gray-200 font-medium">{member.user.approvedBy || 'Belum disetujui'}</p>
            </div>
          </div>
        </div>

        {/* Tracks */}
        {member.tracks.length > 0 && (
          <div className="border-t border-gray-800 mt-6 pt-6">
            <p className="text-gray-500 text-xs mb-3">Track Minat</p>
            <div className="flex flex-wrap gap-2">
              {member.tracks.map(track => (
                <span key={track} className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-sm font-medium border border-blue-500/20">
                  {track}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="border-t border-gray-800 mt-6 pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-950/60 border border-gray-900/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">{member.activityCount ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">Activities</p>
            </div>
            <div className="bg-gray-950/60 border border-gray-900/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{member.projectCount ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">Projects</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <a href="/app/members" className="bg-gray-850 border border-gray-800 text-gray-300 hover:bg-gray-800 px-6 py-3 rounded-lg font-semibold transition text-center flex-1">
          ← Kembali
        </a>
        {member.user.status === 'pending' && (
          <>
            <button
              onClick={() => handleAction('approve')}
              disabled={actionLoading !== null}
              className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold transition flex-1"
            >
              {actionLoading === 'approve' ? 'Approving...' : 'Approve'}
            </button>
            <button
              onClick={() => handleAction('reject')}
              disabled={actionLoading !== null}
              className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold transition flex-1"
            >
              {actionLoading === 'reject' ? 'Rejecting...' : 'Reject'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
