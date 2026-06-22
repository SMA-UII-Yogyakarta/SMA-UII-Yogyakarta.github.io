// Shared client-side utilities untuk halaman dashboard

export function esc(str: unknown): string {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#x27;'}[c] ?? c));
}

export function fmtDate(ts: number, withTime = false): string {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  if (withTime) { opts.hour = '2-digit'; opts.minute = '2-digit'; }
  return new Date(ts).toLocaleDateString('id-ID', opts);
}

export function renderPagination(
  containerId: string,
  anchorId: string,
  total: number,
  page: number,
  limit: number,
  label: string,
  onPage: string,
): void {
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    document.getElementById(anchorId)?.after(container);
  }
  const totalPages = Math.ceil(total / limit);
  if (total === 0 || totalPages <= 1) { container.innerHTML = ''; return; }
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const btnBase = 'px-3 py-1.5 rounded-lg text-sm';
  const btnOn = `${btnBase} bg-gray-800 text-gray-300 hover:bg-gray-700 transition`;
  const btnOff = `${btnBase} bg-gray-800 text-gray-600 cursor-not-allowed`;
  container.className = 'flex items-center justify-between mt-6 pt-4 border-t border-gray-800';
  container.innerHTML = `
    <p class="text-xs text-gray-500">Menampilkan ${start}–${end} dari ${total} ${label}</p>
    <div class="flex gap-2">
      <button onclick="${onPage}(${page - 1})" ${page <= 1 ? 'disabled' : ''} class="${page <= 1 ? btnOff : btnOn}">← Prev</button>
      <span class="px-3 py-1.5 text-sm text-gray-400">${page} / ${totalPages}</span>
      <button onclick="${onPage}(${page + 1})" ${page >= totalPages ? 'disabled' : ''} class="${page >= totalPages ? btnOff : btnOn}">Next →</button>
    </div>
  `;
}

// SVG icons — reusable di template literal
export const icons = {
  edit: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>`,
  trash: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>`,
};

/** Unescape HTML entities — untuk membaca kembali data dari data-* attribute */
export function unesc(str: string): string {
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  return txt.value;
}

/** Set tombol dalam state loading — disabled + spinner */
export function setBtnLoading(btn: HTMLButtonElement | null, loading: boolean, loadingText = 'Menyimpan...'): void {
  if (!btn) return;
  if (loading) {
    if (!btn.dataset.origLabel) btn.dataset.origLabel = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner mr-1.5 inline-block align-middle"></span>${loadingText}`;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.origLabel || 'Simpan';
  }
}

/** Action sheet confirm — gantikan confirm() native. Returns Promise<boolean> */
let _confirmResolve: ((v: boolean) => void) | null = null;

export function setupConfirmModal(): void {
  const okBtn = document.getElementById('confirm-ok') as HTMLButtonElement | null;
  const cancelBtn = document.getElementById('confirm-cancel') as HTMLButtonElement | null;
  if (!okBtn || !cancelBtn) return;

  okBtn.addEventListener('click', () => {
    const r = _confirmResolve;
    _confirmResolve = null;
    (window as any).__modal?.['confirm-modal']?.close();
    r?.(true);
  });

  cancelBtn.addEventListener('click', () => {
    const r = _confirmResolve;
    _confirmResolve = null;
    (window as any).__modal?.['confirm-modal']?.close();
    r?.(false);
  });
}

export function confirmAction(opts: {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    _confirmResolve = resolve;

    const modal = document.getElementById('confirm-modal');
    const titleEl = modal?.querySelector('h2');
    const msgEl = document.getElementById('confirm-msg');
    const okBtn = document.getElementById('confirm-ok') as HTMLButtonElement | null;
    const cancelBtn = document.getElementById('confirm-cancel') as HTMLButtonElement | null;

    if (titleEl) titleEl.textContent = opts.title || 'Konfirmasi';
    if (msgEl) msgEl.textContent = opts.message;
    if (okBtn) {
      okBtn.textContent = opts.confirmText || 'Hapus';
      okBtn.className = `flex-1 px-4 py-2.5 text-white rounded-lg text-sm font-medium transition ${
        opts.danger !== false ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'
      }`;
    }
    if (cancelBtn) cancelBtn.textContent = opts.cancelText || 'Batal';

    (window as any).__modal?.['confirm-modal']?.open();
  });
}

/** Animasikan entry list item satu per satu (staggered) */
export function staggerList(container: HTMLElement, items: HTMLElement[], staggerMs = 60): void {
  items.forEach((el, i) => {
    el.classList.add('list-enter');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transitionDelay = `${i * staggerMs}ms`;
        el.classList.remove('list-enter');
        el.classList.add('list-enter-active');
      });
    });
  });
}

/** Pull-to-refresh untuk container scroll */
export function setupPullToRefresh(
  container: HTMLElement,
  onRefresh: () => Promise<void>,
): () => void {
  let startY = 0;
  let pulling = false;
  const indicator = document.createElement('div');
  indicator.className = 'ptr-indicator';
  indicator.innerHTML = '<span class="spinner"></span>Memuat...';
  container.insertBefore(indicator, container.firstChild);

  function onTouchStart(e: TouchEvent) {
    if (container.scrollTop > 0) return;
    startY = e.touches[0].clientY;
    pulling = true;
  }

  function onTouchMove(e: TouchEvent) {
    if (!pulling) return;
    const delta = e.touches[0].clientY - startY;
    if (delta < 0) { pulling = false; indicator.classList.remove('ptr-visible'); return; }
    if (delta > 80) {
      indicator.textContent = 'Lepaskan untuk memuat ulang';
      indicator.classList.add('ptr-visible');
    } else {
      indicator.textContent = 'Tarik untuk memuat ulang';
      indicator.classList.add('ptr-visible');
      indicator.style.height = `${Math.min(delta, 48)}px`;
    }
  }

  function onTouchEnd() {
    if (!pulling) return;
    pulling = false;
    if (indicator.classList.contains('ptr-visible') && indicator.textContent?.includes('Lepaskan')) {
      indicator.innerHTML = '<span class="spinner"></span>Memuat ulang...';
      onRefresh().finally(() => {
        indicator.classList.remove('ptr-visible');
        indicator.style.height = '';
        indicator.innerHTML = '<span class="spinner"></span>Memuat...';
      });
    } else {
      indicator.classList.remove('ptr-visible');
      indicator.style.height = '';
    }
  }

  container.addEventListener('touchstart', onTouchStart, { passive: true });
  container.addEventListener('touchmove', onTouchMove, { passive: true });
  container.addEventListener('touchend', onTouchEnd);

  return () => {
    container.removeEventListener('touchstart', onTouchStart);
    container.removeEventListener('touchmove', onTouchMove);
    container.removeEventListener('touchend', onTouchEnd);
    indicator.remove();
  };
}

/** Swipe-to-action untuk list items — swipe kiri reveal delete button */
export function setupSwipeAction(
  container: HTMLElement,
  onAction: (id: string, action: string) => Promise<void>,
): () => void {
  const SWIPE_THRESHOLD = 80; // px
  const ACTION_WIDTH = 60; // px

  let startX = 0;
  let currentX = 0;
  let activeItem: HTMLElement | null = null;
  let actionButton: HTMLElement | null = null;

  function onTouchStart(e: TouchEvent) {
    const item = (e.target as HTMLElement).closest<HTMLElement>('[data-swipe-id]');
    if (!item || !e.touches[0]) return;
    
    // Close other open items
    closeAllSwipedItems();
    
    activeItem = item;
    startX = e.touches[0].clientX;
    currentX = startX;
    item.style.transition = 'none';
    
    // Create/show action button
    actionButton = item.querySelector('.swipe-action');
    if (actionButton) {
      actionButton.style.display = 'flex';
      actionButton.style.opacity = '0';
    }
  }

  function onTouchMove(e: TouchEvent) {
    if (!activeItem || !e.touches[0]) return;
    
    currentX = e.touches[0].clientX;
    const delta = currentX - startX;
    
    if (delta < 0 && Math.abs(delta) < ACTION_WIDTH + 20) {
      e.preventDefault();
      const translate = Math.max(-ACTION_WIDTH, delta);
      activeItem.style.transform = `translateX(${translate}px)`;
      
      if (actionButton) {
        const progress = Math.min(Math.abs(delta) / ACTION_WIDTH, 1);
        actionButton.style.opacity = String(progress);
      }
    }
  }

  function onTouchEnd() {
    if (!activeItem) return;
    
    const delta = currentX - startX;
    
    if (delta < -SWIPE_THRESHOLD) {
      // Swipe left enough — show action
      activeItem.style.transform = `translateX(-${ACTION_WIDTH}px)`;
      activeItem.style.transition = 'transform 0.2s ease';
      if (actionButton) {
        actionButton.style.opacity = '1';
        actionButton.style.pointerEvents = 'auto';
      }
    } else {
      // Not enough — reset
      resetItem(activeItem);
    }
    
    activeItem = null;
    actionButton = null;
  }

  function closeAllSwipedItems() {
    container.querySelectorAll<HTMLElement>('[data-swipe-id]').forEach(item => {
      resetItem(item);
    });
  }

  function resetItem(item: HTMLElement) {
    item.style.transform = '';
    item.style.transition = 'transform 0.2s ease';
    const actionBtn = item.querySelector('.swipe-action') as HTMLElement;
    if (actionBtn) {
      actionBtn.style.opacity = '0';
      actionBtn.style.pointerEvents = 'none';
    }
  }

  // Handle action button click
  container.addEventListener('click', (e) => {
    const actionBtn = (e.target as HTMLElement).closest<HTMLElement>('.swipe-action');
    if (!actionBtn) return;
    
    const item = actionBtn.closest<HTMLElement>('[data-swipe-id]');
    const id = item?.dataset.swipeId;
    const action = actionBtn.dataset.action;
    
    if (id && action) {
      onAction(id, action);
      resetItem(item);
    }
  });

  container.addEventListener('touchstart', onTouchStart, { passive: true });
  container.addEventListener('touchmove', onTouchMove, { passive: false });
  container.addEventListener('touchend', onTouchEnd);

  // Close swiped items on scroll
  container.addEventListener('scroll', closeAllSwipedItems, { passive: true });

  return () => {
    container.removeEventListener('touchstart', onTouchStart);
    container.removeEventListener('touchmove', onTouchMove);
    container.removeEventListener('touchend', onTouchEnd);
    container.removeEventListener('scroll', closeAllSwipedItems);
  };
}

function closeAllSwipedItems() {
  // Helper — will be overridden by setupSwipeAction
}

/** Infinite scroll — load more saat scroll mendekati bottom */
export function setupInfiniteScroll(
  container: HTMLElement,
  onLoadMore: () => Promise<boolean>, // returns true if more data available
  threshold = 100, // px from bottom
): () => void {
  let loading = false;
  let hasMore = true;

  function onScroll() {
    if (loading || !hasMore) return;
    
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    
    if (scrollHeight - scrollTop - clientHeight < threshold) {
      loading = true;
      onLoadMore().then(more => {
        hasMore = more;
        loading = false;
      });
    }
  }

  container.addEventListener('scroll', onScroll, { passive: true });
  
  // Initial check
  onScroll();

  return () => {
    container.removeEventListener('scroll', onScroll);
  };
}

/** Upload image ke /api/upload/image, return URL atau null */
export async function uploadImage(
  file: File,
  onStatus: (msg: string, isError: boolean) => void,
): Promise<string | null> {
  if (file.size > 2 * 1024 * 1024) {
    onStatus('✗ File terlalu besar (maks 2MB)', true);
    return null;
  }
  onStatus('⏳ Mengupload...', false);
  const fd = new FormData();
  fd.append('image', file);
  const res = await fetch('/api/upload/image', { method: 'POST', body: fd });
  if (res.ok) {
    const json = await res.json();
    onStatus('', false);
    return json.data?.url ?? null;
  }
  const json = await res.json().catch(() => ({}));
  onStatus(`✗ ${json.error || 'Gagal upload'}`, true);
  return null;
}
