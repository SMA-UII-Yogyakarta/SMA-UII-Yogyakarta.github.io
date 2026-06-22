import React, { useState, useEffect, useCallback, useRef } from 'react';
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

const Avatar = ({ name, src }: { name: string; src?: string }) =>
  src ? (
    <img src={src} alt={name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
  ) : (
    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">
      {(name || 'U').charAt(0).toUpperCase()}
    </div>
  );

const SkeletonList = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-5 animate-pulse">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-800 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-800 rounded w-2/3" />
            <div className="h-3 bg-gray-800/60 rounded w-full" />
            <div className="h-3 bg-gray-800/60 rounded w-1/2" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

interface Activity {
  id: string;
  type: 'contribution' | 'event' | 'workshop' | 'meeting' | 'other';
  title: string;
  description?: string;
  url?: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  createdAt: number;
  metadata?: Record<string, any>;
}

interface ActivityFeedProps {
  initialActivities?: Activity[];
  userId?: string;
  isAdmin?: boolean;
  onAddActivity?: (activity: Omit<Activity, 'id' | 'createdAt'>) => Promise<void>;
  onEditActivity?: (id: string, updates: Partial<Activity>) => Promise<void>;
  onDeleteActivity?: (id: string) => Promise<void>;
}

const typeIcons: Record<string, string> = {
  contribution: '🚀',
  event: '🎉',
  workshop: '📚',
  meeting: '👥',
  other: '📌',
};

const typeLabels: Record<string, string> = {
  contribution: 'Contribution',
  event: 'Event',
  workshop: 'Workshop',
  meeting: 'Meeting',
  other: 'Other',
};

export default function ActivityFeed({
  initialActivities,
  userId,
  isAdmin = false,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities || []);
  const [loading, setLoading] = useState(!initialActivities);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [adding, setAdding] = useState(false);
  
  const observerTarget = useRef<HTMLDivElement>(null);
  const PAGE_LIMIT = 20;

  const loadActivities = useCallback(async (page: number = 1, append: boolean = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_LIMIT),
      });
      
      if (filter) params.set('type', filter);

      const { data, error } = await apiFetch<any>(`/api/activities?${params}`);
      
      if (error) {
        setError(error);
        return;
      }
      
      const { activities = [], total = 0, page = 1 } = data || {};
      
      if (append) {
        setActivities(prev => [...prev, ...activities]);
      } else {
        setActivities(activities);
      }
      
      setHasMore(activities.length === PAGE_LIMIT);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (!initialActivities) {
      loadActivities(1, false);
    }
  }, [loadActivities, initialActivities]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadActivities(currentPage + 1, true);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, currentPage, loadActivities]);

  useEffect(() => {
    loadActivities(1, false);
  }, [filter]);

  const handleAdd = async (activityData: Omit<Activity, 'id' | 'createdAt'>) => {
    if (!onAddActivity) return;
    
    setAdding(true);
    try {
      await onAddActivity(activityData);
      loadActivities(1, false);
    } catch (err) {
      setError('Failed to add activity');
    } finally {
      setAdding(false);
    }
  };

  const handleEdit = async (id: string, updates: Partial<Activity>) => {
    if (!onEditActivity) return;
    
    try {
      await onEditActivity(id, updates);
      loadActivities(1, false);
    } catch (err) {
      setError('Failed to edit activity');
    }
  };

  const handleDelete = async (id: string) => {
    if (!onDeleteActivity) return;
    
    if (!window.confirm('Delete this activity?')) return;
    
    try {
      await onDeleteActivity(id);
      setActivities(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      setError('Failed to delete activity');
    }
  };

  const resetFeed = () => {
    setFilter('');
    setCurrentPage(1);
    loadActivities(1, false);
  };

  if (loading && !activities.length) {
    return <SkeletonList count={5} />;
  }

  if (error && !activities.length) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400 text-sm mb-4">{error}</p>
        <button 
          onClick={() => loadActivities(1, false)}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {['', 'contribution', 'event', 'workshop', 'meeting', 'other'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-300 ${
              filter === type
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-gray-900/60 text-gray-400 hover:text-white border-gray-800/80 hover:border-gray-700/80'
            }`}
          >
            {type === '' ? 'Semua' : typeLabels[type]}
          </button>
        ))}
      </div>

      {/* Activities List */}
      {activities.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-20 h-20 mx-auto text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-400 text-sm mb-1">Belum ada aktivitas</p>
          <p className="text-gray-500 text-xs mb-4">Jadilah yang pertama untuk log aktivitas</p>
          {onAddActivity && (
            <button 
              onClick={() => setAdding(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
            >
              Log Activity
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-5 hover:border-gray-750 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-start gap-3">
                <Avatar 
                  name={activity.userName || 'User'} 
                  src={activity.userAvatar}
                  size="md"
                />
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{typeIcons[activity.type]}</span>
                      <Badge variant="info">{typeLabels[activity.type]}</Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {new Date(activity.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      
                      {(activity.userId === userId || isAdmin) && (
                        <>
                          <button
                            onClick={() => handleEdit(activity.id, { title: prompt('Edit title:', activity.title) || activity.title })}
                            className="text-gray-400 hover:text-blue-400 text-xs transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(activity.id)}
                            className="text-gray-400 hover:text-red-400 text-xs transition"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-white mb-1">{activity.title}</h3>
                  
                  {activity.description && (
                    <p className="text-sm text-gray-400 mb-2">{activity.description}</p>
                  )}
                  
                  {activity.url && (
                    <a
                      href={activity.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 transition"
                    >
                      View Link →
                    </a>
                  )}
                  
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-gray-500">by</span>
                    <span className="text-xs text-gray-300 font-medium">
                      {activity.userName || 'Anonymous'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div ref={observerTarget} className="h-10" />

      {loading && activities.length > 0 && (
        <div className="text-center py-4">
          <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {adding && onAddActivity && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-white mb-4">Log Activity</h2>
            
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                await handleAdd({
                  type: formData.get('type') as Activity['type'],
                  title: formData.get('title') as string,
                  description: formData.get('description') as string || undefined,
                  url: formData.get('url') as string || undefined,
                  userId: userId || '',
                });
                setAdding(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Type *
                </label>
                <select
                  name="type"
                  required
                  className="w-full px-4 py-3 bg-gray-950/60 border border-gray-800/80 rounded-xl text-sm text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus:border-blue-500/60 focus:bg-gray-900/60 transition-all duration-300 cursor-pointer"
                >
                  <option value="contribution">Contribution</option>
                  <option value="event">Event</option>
                  <option value="workshop">Workshop</option>
                  <option value="meeting">Meeting</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  minLength={3}
                  className="w-full px-4 py-3 bg-gray-950/60 border border-gray-800/80 rounded-xl text-sm text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus:border-blue-500/60 focus:bg-gray-900/60 transition-all duration-300 placeholder-gray-600"
                  placeholder="e.g., Won IOI 2026"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-950/60 border border-gray-800/80 rounded-xl text-sm text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus:border-blue-500/60 focus:bg-gray-900/60 transition-all duration-300 placeholder-gray-600"
                  placeholder="Describe your activity..."
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                  URL
                </label>
                <input
                  type="url"
                  name="url"
                  className="w-full px-4 py-3 bg-gray-950/60 border border-gray-800/80 rounded-xl text-sm text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus:border-blue-500/60 focus:bg-gray-900/60 transition-all duration-300 placeholder-gray-600"
                  placeholder="https://..."
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-850 text-gray-300 border border-gray-800/85 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all duration-300"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}