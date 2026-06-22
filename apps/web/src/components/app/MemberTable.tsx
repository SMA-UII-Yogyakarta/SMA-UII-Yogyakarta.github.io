import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../lib/api-client';

// --- Inline UI primitives (Astro components can't be imported into React) ---

type BadgeVariant = 'success' | 'warning' | 'error' | 'info';
const badgeClasses: Record<BadgeVariant, string> = {
  success: 'text-green-400 bg-green-400/10',
  warning: 'text-yellow-400 bg-yellow-400/10',
  error:   'text-red-400 bg-red-400/10',
  info:    'text-blue-400 bg-blue-400/10',
};
const Badge = ({ variant, children }: { variant: BadgeVariant; children: React.ReactNode }) => (
  <span className={`px-2 py-0.5 rounded text-xs font-medium ${badgeClasses[variant]}`}>{children}</span>
);

const AvatarListItem = ({ name, subtitle, tracks }: { name: string; subtitle: string; tracks?: string[] }) => (
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
      {(name || '?').charAt(0).toUpperCase()}
    </div>
    <div>
      <p className="font-semibold text-sm">{name}</p>
      <p className="text-xs text-gray-400">{subtitle}</p>
      {tracks && tracks.length > 0 && <p className="text-xs text-gray-500">{tracks.join(', ')}</p>}
    </div>
  </div>
);

const SkeletonList = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-5 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-800 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-800 rounded w-3/4" />
            <div className="h-3 bg-gray-800/60 rounded w-1/2" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

interface Member {
  id: string;
  name: string;
  email: string;
  class: string;
  status: 'pending' | 'active' | 'rejected';
  tracks?: string[];
  role?: string;
  nisn?: string;
  nis?: string;
  joinedAt?: number;
  approvedBy?: string;
}

interface MemberTableProps {
  initialMembers?: Member[];
  isAdmin?: boolean;
  onApprove?: (userId: string, action: 'approve' | 'reject') => Promise<void>;
  onSetPassword?: (userId: string, password: string) => Promise<void>;
  onToggleAlumni?: (userId: string, role: 'alumni' | 'member') => Promise<void>;
}

type SortField = 'name' | 'status' | 'class' | 'joinedAt' | 'email';
type SortOrder = 'asc' | 'desc';

export default function MemberTable({ 
  initialMembers, 
  isAdmin = false,
  onApprove,
  onSetPassword,
  onToggleAlumni 
}: MemberTableProps) {
  const [members, setMembers] = useState<Member[]>(initialMembers || []);
  const [loading, setLoading] = useState(!initialMembers);
  const [error, setError] = useState<string | null>(null);
  
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [trackFilter, setTrackFilter] = useState<string>('');
  const [classFilter, setClassFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [sortField, setSortField] = useState<SortField>('joinedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const PAGE_LIMIT = 20;

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({ 
        admin: isAdmin ? '1' : '0',
        page: String(currentPage), 
        limit: String(PAGE_LIMIT) 
      });
      
      if (statusFilter) params.set('status', statusFilter);
      if (trackFilter) params.set('track', trackFilter);
      if (classFilter) params.set('class', classFilter);
      if (searchQuery) params.set('search', searchQuery);

      const { data, error } = await apiFetch<any>(`/api/members?${params}`);
      
      if (error) {
        setError(error);
        return;
      }
      
      const { members = [], total = 0, page = 1 } = data || {};
      setMembers(members);
      setTotalMembers(total);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, trackFilter, classFilter, searchQuery, isAdmin]);

  useEffect(() => {
    if (!initialMembers) {
      loadMembers();
    }
  }, [loadMembers, initialMembers]);

  const handleApprove = async (userId: string, action: 'approve' | 'reject') => {
    if (!onApprove) return;
    
    const originalMembers = [...members];
    setMembers(prev => prev.filter(m => m.id !== userId));
    setTotalMembers(prev => prev - 1);
    
    try {
      await onApprove(userId, action);
      loadMembers();
    } catch (err) {
      setMembers(originalMembers);
      setTotalMembers(prev => prev + 1);
      setError('Failed to process action');
    }
  };

  const handleSetPassword = async (userId: string, password: string) => {
    if (!onSetPassword) return;
    
    try {
      await onSetPassword(userId, password);
    } catch (err) {
      setError('Failed to set password');
    }
  };

  const handleToggleAlumni = async (userId: string, role: 'alumni' | 'member') => {
    if (!onToggleAlumni) return;
    
    try {
      await onToggleAlumni(userId, role);
      loadMembers();
    } catch (err) {
      setError('Failed to update role');
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const resetFilters = () => {
    setStatusFilter('');
    setTrackFilter('');
    setClassFilter('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  if (loading && !members.length) {
    return <SkeletonList count={5} />;
  }

  if (error && !members.length) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400 text-sm mb-4">{error}</p>
        <button 
          onClick={loadMembers}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const hasActiveFilters = statusFilter || trackFilter || classFilter || searchQuery;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2">
          {['', 'pending', 'active', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-300 ${
                statusFilter === status
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-900/60 text-gray-400 hover:text-white border-gray-800/80 hover:border-gray-700/80'
              }`}
            >
              {status === '' ? 'Semua' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <select
          value={classFilter}
          onChange={(e) => { setClassFilter(e.target.value); setCurrentPage(1); }}
          className="px-4 py-2 bg-gray-950/60 border border-gray-800/80 rounded-xl text-sm text-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus:border-blue-500/60 focus:bg-gray-900/60 transition-all duration-300 cursor-pointer"
        >
          <option value="">Semua Kelas</option>
          <option value="X">X</option>
          <option value="XI">XI</option>
          <option value="XII">XII</option>
        </select>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          placeholder="Cari nama, email, NISN..."
          className="flex-1 px-4 py-2 bg-gray-950/60 border border-gray-800/80 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus:border-blue-500/60 focus:bg-gray-900/60 transition-all duration-300"
        />

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-semibold transition"
          >
            Reset
          </button>
        )}
      </div>

      {/* Members List */}
      {members.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-20 h-20 mx-auto text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
          <p className="text-gray-400 text-sm mb-1">Tidak ada anggota ditemukan</p>
          <p className="text-gray-500 text-xs mb-4">Coba ubah filter atau kata kunci pencarian</p>
          <button 
            onClick={resetFilters}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-5 flex items-center justify-between hover:border-gray-750 hover:shadow-md transition-all duration-300"
            >
              <AvatarListItem
                name={member.name}
                subtitle={`${member.class} · ${member.email}`}
                tracks={member.tracks}
                size="lg"
              />
              
              <div className="flex items-center gap-2">
                <Badge 
                  variant={member.status === 'active' ? 'success' : member.status === 'pending' ? 'warning' : 'error'}
                >
                  {member.status}
                </Badge>

                {member.status === 'pending' && isAdmin && (
                  <>
                    <button
                      onClick={() => handleApprove(member.id, 'approve')}
                      className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-xs transition"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleApprove(member.id, 'reject')}
                      className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-xs transition"
                    >
                      Reject
                    </button>
                  </>
                )}

                {member.status === 'active' && isAdmin && member.role !== 'maintainer' && (
                  <button
                    onClick={() => handleToggleAlumni(member.id, member.role === 'alumni' ? 'member' : 'alumni')}
                    className={`px-3 py-1 rounded text-xs transition ${
                      member.role === 'alumni'
                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-yellow-400'
                    }`}
                  >
                    {member.role === 'alumni' ? 'Kembalikan' : 'Alumni'}
                  </button>
                )}

                {member.status === 'active' && isAdmin && (
                  <button
                    onClick={() => {
                      const password = prompt(`Set password untuk ${member.name}:`);
                      if (password) handleSetPassword(member.id, password);
                    }}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs transition"
                    title="Set Password"
                  >
                    🔑
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalMembers > PAGE_LIMIT && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 rounded-lg text-sm font-semibold transition"
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-400">
            Page {currentPage} of {Math.ceil(totalMembers / PAGE_LIMIT)}
          </span>
          
          <button
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={currentPage >= Math.ceil(totalMembers / PAGE_LIMIT)}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 rounded-lg text-sm font-semibold transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}