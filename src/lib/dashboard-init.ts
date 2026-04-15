import { navItems } from '@lib/nav';

export function escapeHtml(str: string): string {
  if (!str) return '';
  const htmlEntities: Record<string, string> = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#x27;', '/': '&#x2F;',
  };
  return str.replace(/[&<>"'/]/g, (char) => htmlEntities[char] || char);
}

export function updateSidebarState(isCollapsed: boolean) {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('main-content');
  const toggleIcon = document.getElementById('toggle-icon');
  const toggleBtn = document.getElementById('sidebar-toggle');
  
  if (isCollapsed) {
    sidebar?.classList.add('sidebar-collapsed');
    mainContent?.classList.add('sidebar-collapsed');
    toggleIcon?.classList.add('rotate-180');
    toggleBtn?.setAttribute('title', 'Expand sidebar');
  } else {
    sidebar?.classList.remove('sidebar-collapsed');
    mainContent?.classList.remove('sidebar-collapsed');
    toggleIcon?.classList.remove('rotate-180');
    toggleBtn?.setAttribute('title', 'Collapse sidebar');
  }
  
  localStorage.setItem('sidebar-collapsed', String(isCollapsed));
  
  document.querySelectorAll('.sidebar-label').forEach(el => {
    el.classList.toggle('hidden', isCollapsed);
  });
}

export async function loadNotifications() {
  try {
    const response = await fetch('/api/notifications');
    if (!response.ok) return;
    const result = await response.json();
    const notifications = result.data || [];
    const notifList = document.getElementById('notification-list');
    const badge = document.getElementById('notification-badge');
    
    if (notifications.length > 0) {
      badge?.classList.remove('hidden');
      if (notifList) {
        notifList.innerHTML = '';
        notifications.forEach((n: any) => {
          const div = document.createElement('div');
          div.className = 'p-2 hover:bg-gray-800 rounded cursor-pointer';
          div.onclick = () => window.markNotificationRead(n.id);
          
          const p = document.createElement('p');
          p.className = 'text-sm';
          p.textContent = n.message || '';
          
          const date = document.createElement('p');
          date.className = 'text-xs text-gray-500';
          date.textContent = new Date(n.createdAt).toLocaleDateString('id-ID');
          
          div.appendChild(p);
          div.appendChild(date);
          notifList.appendChild(div);
        });
      }
    }
  } catch (e) {
    console.error('Failed to load notifications:', e);
  }
}

export async function initDashboard() {
  try {
    const response = await fetch('/api/auth/me');
    if (!response.ok) {
      window.location.href = '/login';
      return;
    }
    
    const result = await response.json();
    const user = result.data;

    const savedState = localStorage.getItem('sidebar-collapsed');
    updateSidebarState(savedState === 'true');

    const sidebarToggle = document.getElementById('sidebar-toggle');
    sidebarToggle?.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      updateSidebarState(!sidebar?.classList.contains('sidebar-collapsed'));
    });

    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    mobileMenuBtn?.addEventListener('click', () => sidebar?.classList.toggle('-translate-x-full'));

    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#sidebar') && !target.closest('#mobile-menu-btn')) {
        sidebar?.classList.add('-translate-x-full');
      }
      if (!target.closest('#notification-btn') && !target.closest('#notification-dropdown')) {
        document.getElementById('notification-dropdown')?.classList.add('hidden');
      }
    });

    document.getElementById('notification-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('notification-dropdown')?.classList.toggle('hidden');
    });

    const sidebarNav = document.getElementById('sidebar-nav');
    const items = navItems[user.role as keyof typeof navItems] || navItems.member;
    
    if (sidebarNav) {
      sidebarNav.innerHTML = '';
      items.forEach(item => {
        const a = document.createElement('a');
        a.href = item.href;
        a.className = 'flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-800 transition text-gray-400 hover:text-white';
        a.dataset.nav = item.label.toLowerCase();
        a.title = item.label;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'w-5 h-5 flex-shrink-0');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${item.icon}"/>`;
        
        const span = document.createElement('span');
        span.className = 'sidebar-label whitespace-nowrap';
        span.textContent = item.label;

        a.appendChild(svg);
        a.appendChild(span);
        sidebarNav.appendChild(a);
      });
    }

    const currentPath = window.location.pathname;
    document.querySelectorAll('[data-nav]').forEach(el => {
      const href = el.getAttribute('href');
      if (currentPath === href || currentPath.startsWith(href + '/')) {
        el.classList.add('bg-gray-800', 'text-white');
      }
    });

    window.markNotificationRead = async (id: string) => {
      try {
        await fetch('/api/notifications/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
        loadNotifications();
      } catch (e) {
        console.error('Failed to mark notification read:', e);
      }
    };

    loadNotifications();

  } catch (error) {
    console.error('Failed to load dashboard:', error);
    window.location.href = '/login';
  }
}