export function escapeHtml(str: string): string {
  if (!str) return '';
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '/': '&#x2F;' };
  return str.replace(/[&<>"'/]/g, c => map[c] || c);
}

export function updateSidebarState(isCollapsed: boolean) {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('main-content');
  const toggleBtn = document.getElementById('sidebar-toggle');

  sidebar?.classList.toggle('sidebar-collapsed', isCollapsed);
  mainContent?.classList.toggle('sidebar-collapsed', isCollapsed);
  toggleBtn?.setAttribute('title', isCollapsed ? 'Expand sidebar' : 'Collapse sidebar');
  localStorage.setItem('sidebar-collapsed', String(isCollapsed));
  document.querySelectorAll('.sidebar-label').forEach(el => el.classList.toggle('hidden', isCollapsed));
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
  // Sidebar state - only for desktop
  const isDesktop = window.innerWidth >= 1024;
  if (isDesktop) {
    updateSidebarState(localStorage.getItem('sidebar-collapsed') === 'true');
  }

  document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
    // Only toggle collapse on desktop
    if (window.innerWidth >= 1024) {
      updateSidebarState(!document.getElementById('sidebar')?.classList.contains('sidebar-collapsed'));
    }
  });

  // Mobile menu - only for mobile
  const sidebar = document.getElementById('sidebar');
  document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
    sidebar?.classList.toggle('-translate-x-full');
  });
  
  // Close sidebar/dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    // Close mobile sidebar when clicking outside (only on mobile)
    if (window.innerWidth < 1024 && !t.closest('#sidebar') && !t.closest('#mobile-menu-btn')) {
      sidebar?.classList.add('-translate-x-full');
    }
    // Close notification dropdown
    if (!t.closest('#notification-btn') && !t.closest('#notification-dropdown')) {
      document.getElementById('notification-dropdown')?.classList.add('hidden');
    }
  });

  document.getElementById('notification-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('notification-dropdown')?.classList.toggle('hidden');
  });

  // Active nav highlight
  const currentPath = window.location.pathname;
  document.querySelectorAll('[data-nav]').forEach(el => {
    const href = el.getAttribute('href');
    if (href && (currentPath === href || currentPath.startsWith(href + '/'))) {
      el.classList.add('bg-gray-800', 'text-white');
    }
  });

  // Notification read handler
  window.markNotificationRead = async (id: string) => {
    try {
      await fetch('/api/notifications/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      loadNotifications();
    } catch (e) { console.error(e); }
  };

  loadNotifications();
}
