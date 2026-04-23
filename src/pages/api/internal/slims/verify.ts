import type { APIRoute } from 'astro';
import { createErrorResponse, createSuccessResponse } from '@lib/api-utils';

const SLIMS_API_URL = import.meta.env.SLIMS_API_URL;
const SLIMS_API_KEY = import.meta.env.SLIMS_API_KEY;

/**
 * Proxy endpoint untuk SLIMS API - menyembunyikan implementasi PHP
 * GET /api/internal/slims/verify?nis=1724
 */
export const GET: APIRoute = async ({ url, locals }) => {
  const { user } = locals;
  
  // Hanya authenticated users yang bisa akses
  if (!user) return createErrorResponse('Unauthorized', 401);
  
  const nis = url.searchParams.get('nis');
  if (!nis) return createErrorResponse('Parameter nis diperlukan', 400);

  try {
    const response = await fetch(
      `${SLIMS_API_URL}/api.php?action=verify&nis=${encodeURIComponent(nis)}`,
      {
        headers: {
          'X-Lab-API-Key': SLIMS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      return createErrorResponse('SLIMS API error', response.status);
    }

    const data = await response.json();
    
    // Normalize response
    if (data.error) {
      return createErrorResponse(data.error, 404);
    }

    return createSuccessResponse({
      nis: data.nis,
      name: data.name,
      email: data.email,
      class: data.member_type, // Map member_type ke class
      isExpired: data.is_expired,
      expiredAt: data.expire_date,
      isPending: data.is_pending,
    });
  } catch (error) {
    console.error('SLIMS verify error:', error);
    return createErrorResponse('Gagal verifikasi ke sistem perpustakaan', 500);
  }
};
