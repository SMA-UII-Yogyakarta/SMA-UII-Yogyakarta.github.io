import React, { useEffect, useState } from 'react';
import { apiFetch, getCachedData } from '../../lib/api-client';

interface UserSettings {
  id: string;
  name: string;
  email: string;
  nis: string;
  nisn: string | null;
  class: string;
  role: string;
  status: string;
  githubUsername: string | null;
}

interface SettingsDashboardProps {
  initialData?: UserSettings | null;
}

export default function SettingsDashboard({ initialData }: SettingsDashboardProps) {
  const cachedSettings = getCachedData<UserSettings>('/api/profile');
  const [data, setData] = useState<UserSettings | null>(cachedSettings?.data ?? initialData ?? null);
  const [loading, setLoading] = useState(!cachedSettings?.data && !initialData);
  const [nameInput, setNameInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!initialData) {
      loadSettingsData();
    } else {
      setNameInput(initialData.name);
      setLoading(false);
    }
  }, [initialData]);

  const loadSettingsData = async () => {
    if (!cachedSettings?.data) setLoading(true);
    try {
      const res = await apiFetch<UserSettings>('/api/profile');
      if (res.data) {
        setData(res.data);
        setNameInput(res.data.name);
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      setSaveStatus({ type: 'error', message: 'Nama harus diisi' });
      return;
    }

    setSaving(true);
    setSaveStatus(null);

    try {
      const res = await apiFetch<any>('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name: nameInput }),
      });

      if (res.error) {
        setSaveStatus({ type: 'error', message: res.error });
      } else {
        setSaveStatus({ type: 'success', message: '✓ Tersimpan' });
        if (data) {
          setData({ ...data, name: nameInput });
        }
        // Sync with layout header/sidebar username
        const sidebarUsername = document.getElementById('sidebar-username');
        if (sidebarUsername) sidebarUsername.textContent = nameInput;
        const dropdownUsername = document.getElementById('topbar-dropdown-username');
        if (dropdownUsername) dropdownUsername.textContent = nameInput;
      }
    } catch (err) {
      console.error(err);
      setSaveStatus({ type: 'error', message: 'Terjadi kesalahan' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl h-80"></div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl h-48"></div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-red-400">Gagal memuat pengaturan. Silakan coba lagi.</div>;
  }

  const isMaintainer = data.role === 'maintainer';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left panel: settings form */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider">Pengaturan Akun</h3>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold px-4 py-2 transition duration-300"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="name-input" className="block text-xs text-gray-400 mb-1">Nama</label>
              <input
                id="name-input"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full bg-gray-950/60 border border-gray-800/80 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500 transition duration-300"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={data.email}
                disabled
                className="w-full bg-gray-950/30 border border-gray-800/50 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed"
              />
              <p className="text-[10px] text-gray-500 mt-1">Email tidak dapat diubah</p>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">GitHub</label>
              {data.githubUsername ? (
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-gray-950/60 border border-gray-800/80 rounded-xl">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-300 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    <a
                      href={`https://github.com/${data.githubUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-100 hover:text-blue-400 transition"
                    >
                      @{data.githubUsername}
                    </a>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400">TERHUBUNG</span>
                  </div>
                </div>
              ) : (
                <a
                  href="/api/auth/github?returnTo=/app/settings"
                  className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-gray-950/60 border border-gray-800/80 rounded-xl text-sm text-gray-400 hover:text-white hover:border-gray-700 transition w-full"
                >
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  Hubungkan dengan GitHub
                </a>
              )}
            </div>
          </form>

          {saveStatus && (
            <p className={`text-xs ${saveStatus.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {saveStatus.message}
            </p>
          )}
        </div>
      </div>

      {/* Right panel: account metadata card */}
      <div className="space-y-4">
        <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6">
          <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-4">Info Akun</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Role</span>
              <span className="capitalize text-gray-200">{data.role}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Status</span>
              <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${data.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                {data.status.toUpperCase()}
              </span>
            </div>
            {data.nisn && (
              <div className="flex justify-between">
                <span className="text-gray-400">NISN</span>
                <span className="font-mono text-gray-200">{data.nisn}</span>
              </div>
            )}
          </div>
        </div>

        {isMaintainer && (
          <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6">
            <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-4">Sistem</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Database</span>
                <span className="text-blue-400 font-semibold">Turso</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Framework</span>
                <span className="text-gray-200">Astro 6 SSR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Anggota</span>
                <a href="/app/members" className="text-blue-400 hover:text-blue-300 font-semibold">Lihat →</a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
