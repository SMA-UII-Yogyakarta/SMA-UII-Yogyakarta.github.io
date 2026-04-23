import type { APIRoute } from 'astro';
import { createErrorResponse, createSuccessResponse } from '@lib/api-utils';

export const GET: APIRoute = async ({ url }) => {
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '30'), 100);
  const days  = parseInt(url.searchParams.get('days') ?? '0');

  const slimsUrl = import.meta.env.SLIMS_API_URL;
  const slimsKey = import.meta.env.SLIMS_API_KEY;

  if (!slimsUrl || !slimsKey) {
    // Mock data untuk development
    return createSuccessResponse({
      total: 5,
      days: 'all',
      visitors: [
        { rank: 1, member_id: '2033', name: 'Siswa A', member_type: 'Siswa', visit_count: 88, last_visit: '2026-02-09 15:12:32' },
        { rank: 2, member_id: '2032', name: 'Siswa B', member_type: 'Siswa', visit_count: 58, last_visit: '2026-01-29 12:31:05' },
        { rank: 3, member_id: '2045', name: 'Siswa C', member_type: 'Siswa', visit_count: 58, last_visit: '2026-01-06 14:47:28' },
        { rank: 4, member_id: '2017', name: 'Siswa D', member_type: 'Siswa', visit_count: 52, last_visit: '2026-02-01 10:00:00' },
        { rank: 5, member_id: '2021', name: 'Siswa E', member_type: 'Siswa', visit_count: 47, last_visit: '2026-01-15 09:30:00' },
      ],
    });
  }

  try {
    const params = new URLSearchParams({ action: 'top-visitors', limit: String(limit) });
    if (days > 0) params.set('days', String(days));

    const res = await fetch(`${slimsUrl}/api.php?${params}`, {
      headers: { 'X-Lab-API-Key': slimsKey },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error(`SLiMS top-visitors error: ${res.status}`);
      return createErrorResponse('SLiMS tidak tersedia', 500);
    }

    const data = await res.json();
    return createSuccessResponse(data);
  } catch (error) {
    console.error('top-visitors error:', error);
    return createErrorResponse('Terjadi kesalahan', 500);
  }
};
