import type { APIRoute } from 'astro';
import { createErrorResponse, createSuccessResponse } from '@lib/api-utils';

// Fallback mock data — digunakan saat SLIMS_API_URL tidak dikonfigurasi (development)
// Di production, set SLIMS_API_URL dan SLIMS_API_KEY di environment
const MOCK_SLIMS_DATA = [
  { nis: '1724', name: 'ALPIS GELIRIS TARI', email: '1724@students.smauiiyk.sch.id', class: 'XII IPA 1', expiredAt: '2026-08-12', isPending: false },
  { nis: '1751', name: 'ARIF MUHAMMAD MUNIF', email: '1751@students.smauiiyk.sch.id', class: 'XII IPA 2', expiredAt: '2026-08-12', isPending: false },
  { nis: '1725', name: 'ATFAL MAULANA YULIANTO', email: '1725@students.smauiiyk.sch.id', class: 'XI IPA 1', expiredAt: '2026-08-12', isPending: false },
  { nis: '1739', name: 'DEVITASARI', email: '1739@students.smauiiyk.sch.id', class: 'XII IPS 1', expiredAt: '2026-08-12', isPending: false },
  { nis: '1738', name: 'DIANA ARI MINARSIH', email: '1738@students.smauiiyk.sch.id', class: 'XII IPA 3', expiredAt: '2026-08-12', isPending: false },
  { nis: '1763', name: 'AHMAD ZIDAN', email: '1763@students.smauiiyk.sch.id', class: 'X IPA 1', expiredAt: '2024-03-27', isPending: false },
  { nis: '1800', name: 'ACHMAD KHASAN NURWAHIDIN', email: '1800@students.smauiiyk.sch.id', class: 'XII IPA 1', expiredAt: '2024-03-27', isPending: false },
  { nis: '1812', name: 'ABDUL RAHIM ABUBAKAR', email: '1812@students.smauiiyk.sch.id', class: 'X IPS 1', expiredAt: '2024-03-27', isPending: false },
];

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    // Field yang diterima: nis (NIS siswa, sesuai member_id di SLiMS)
    // Catatan: SLiMS SMA UII menggunakan NIS (bukan NISN) sebagai member_id
    const { nisn: nis } = body;

    if (!nis) {
      return createErrorResponse('NIS harus diisi', 400);
    }

    const slimsUrl  = import.meta.env.SLIMS_API_URL;
    const slimsKey  = import.meta.env.SLIMS_API_KEY;

    // ── Mode production: call SLiMS API ──────────────────────────────────
    if (slimsUrl && slimsKey) {
      const res = await fetch(
        `${slimsUrl}/api.php?action=verify&nis=${encodeURIComponent(nis)}`,
        {
          headers: { 'X-Lab-API-Key': slimsKey },
          signal: AbortSignal.timeout(5000), // timeout 5 detik
        }
      );

      if (res.status === 404) {
        return createErrorResponse('NIS tidak ditemukan di SLiMS', 404, { code: 'MEMBER_NOT_FOUND' });
      }

      if (!res.ok) {
        console.error(`SLiMS API error: ${res.status}`);
        return createErrorResponse('SLiMS tidak tersedia, coba lagi nanti', 500);
      }

      const data = await res.json();

      if (!data.found) {
        return createErrorResponse('NIS tidak ditemukan di SLiMS', 404, { code: 'MEMBER_NOT_FOUND' });
      }

      return createSuccessResponse({
        nisn: data.nis,  // platform pakai field 'nisn' tapi isinya NIS dari SLiMS
        nis:  data.nis,
        name: data.name,
        email: data.email,
        // SLiMS tidak menyimpan kelas — field ini kosong, diisi user saat registrasi
        class: '',
        gender: data.gender ?? '',
        birthDate: data.birth_date ?? '',
        phone: data.phone ?? '',
        memberType: data.member_type ?? '',
        isExpired: data.is_expired,
        expiredAt: data.expire_date,
        isPending: data.is_pending,
      });
    }

    // ── Mode development: fallback ke mock data ───────────────────────────
    console.warn('[slims/verify] SLIMS_API_URL tidak dikonfigurasi, menggunakan mock data');

    const member = MOCK_SLIMS_DATA.find(m => m.nis === nis);

    if (!member) {
      return createErrorResponse('NIS tidak ditemukan di SLiMS', 404, { code: 'MEMBER_NOT_FOUND' });
    }

    const isExpired = new Date(member.expiredAt) < new Date();

    return createSuccessResponse({
      nisn: member.nis,
      nis:  member.nis,
      name: member.name,
      email: member.email,
      class: '',  // SLiMS tidak menyimpan kelas — diisi user saat registrasi
      isExpired,
      expiredAt: member.expiredAt,
      isPending: member.isPending,
    });

  } catch (error) {
    console.error('SLiMS verification error:', error);
    return createErrorResponse('Terjadi kesalahan saat verifikasi', 500);
  }
};
