export function fmtDate(ts: number | null | undefined, long = false): string {
  if (!ts) return '-';
  return new Date(ts).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: long ? 'long' : 'short',
    year: 'numeric',
  });
}

export function fmtDateTime(ts: number | null | undefined): string {
  if (!ts) return '-';
  return new Date(ts).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
