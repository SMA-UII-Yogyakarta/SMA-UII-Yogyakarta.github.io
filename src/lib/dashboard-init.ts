export function escapeHtml(str: string): string {
  if (!str) return '';
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '/': '&#x2F;' };
  return str.replace(/[&<>"'/]/g, c => map[c] || c);
}

export function setSidebar(state: 'hidden' | 'minimized' | 'expanded' | 'overlay') {
  document.documentElement.setAttribute('data-sidebar', state);
  const toggleBtn = document.getElementById('sidebar-toggle');
  if (toggleBtn) {
    toggleBtn.setAttribute('title', state === 'expanded' ? 'Collapse sidebar' : 'Expand sidebar');
  }
  if (state === 'expanded' || state === 'minimized') {
    localStorage.setItem('sidebar-collapsed', state === 'minimized' ? 'true' : 'false');
  }
  // sync sidebar-label visibility (untuk profile dropdown script di Sidebar.astro)
  const isMin = state === 'minimized' || state === 'overlay';
  document.querySelectorAll('.sidebar-label').forEach(el => {
    (el as HTMLElement).style.display = isMin ? 'none' : '';
  });
}

export function updateSidebarState(isCollapsed: boolean) {
  setSidebar(isCollapsed ? 'minimized' : 'expanded');
}

export async function loadNotifications() {
  try {
    const res = await fetch('/api/notifications');
    if (!res.ok) return;
    const { data: notifications = [] } = await res.json();
    const badge = document.getElementById('notification-badge');
    const notifList = document.getElementById('notification-list');
    if (!notifications.length) return;
    badge?.classList.remove('hidden');
    if (notifList) {
      notifList.innerHTML = notifications.map((n: any) => `
        <div class="p-2 hover:bg-gray-800 rounded cursor-pointer" onclick="window.markNotificationRead('${n.id}')">
          <p class="text-sm">${escapeHtml(n.message || '')}</p>
          <p class="text-xs text-gray-500">${new Date(n.createdAt).toLocaleDateString('id-ID')}</p>
        </div>
      `).join('');
    }
  } catch (e) {
    console.error('Failed to load notifications:', e);
  }
}

export function initDashboard(_options: { role: string; userName: string }) {
  const w = window.innerWidth;

  // Apply correct state on load (inline script sudah set di HTML, ini untuk sync JS state)
  if (w >= 1024) {
    setSidebar(localStorage.getItem('sidebar-collapsed') === 'true' ? 'minimized' : 'expanded');
  }

  // Toggle button
  document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-sidebar');
    const w = window.innerWidth;
    if (w >= 1024) {
      setSidebar(current === 'expanded' ? 'minimized' : 'expanded');
    } else if (w >= 640) {
      // Tablet: minimized ↔ overlay
      setSidebar(current === 'overlay' ? 'minimized' : 'overlay');
    }
  });

  // Close tablet overlay saat klik di luar
  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const current = document.documentElement.getAttribute('data-sidebar');
    if (current === 'overlay' && !t.closest('#sidebar') && !t.closest('#sidebar-toggle')) {
      setSidebar('minimized');
    }
    if (!t.closest('#notification-btn') && !t.closest('#notification-dropdown')) {
      document.getElementById('notification-dropdown')?.classList.add('hidden');
    }
  });

  document.getElementById('notification-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('notification-dropdown')?.classList.toggle('hidden');
  });

  // Responsive resize
  let resizeTimer: ReturnType<typeof setTimeout>;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const w = window.innerWidth;
      const current = document.documentElement.getAttribute('data-sidebar');
      if (w < 640 && current !== 'hidden') {
        setSidebar('hidden');
      } else if (w >= 640 && w < 1024 && (current === 'hidden' || current === 'expanded')) {
        setSidebar('minimized');
      } else if (w >= 1024 && (current === 'hidden' || current === 'overlay')) {
        setSidebar(localStorage.getItem('sidebar-collapsed') === 'true' ? 'minimized' : 'expanded');
      }
    }, 100);
  });
  const currentPath = window.location.pathname;
  document.querySelectorAll('[data-nav]').forEach(el => {
    const href = el.getAttribute('href');
    if (href && (currentPath === href || currentPath.startsWith(href + '/'))) {
      el.classList.add('bg-gray-800', 'text-white');
    }
  });

  window.markNotificationRead = async (id: string) => {
    try {
      await fetch('/api/notifications/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      loadNotifications();
    } catch (e) { console.error(e); }
  };

  loadNotifications();
}
