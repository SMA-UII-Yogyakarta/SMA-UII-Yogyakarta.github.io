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
