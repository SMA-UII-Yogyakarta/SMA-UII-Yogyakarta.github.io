import type { APIRoute } from 'astro';
import { createErrorResponse, createSuccessResponse } from '@lib/api-utils';

interface MockMember {
  nisn: string;
  name: string;
  email: string;
  class: string;
  expiredAt: string;
  isPending: boolean;
}

const MOCK_SLIMS_DATA: MockMember[] = [
  { nisn: '1724', name: 'ALPIS GELIRIS TARI', email: '1724@students.smauiiyk.sch.id', class: 'XII IPA 1', expiredAt: '2026-08-12', isPending: false },
  { nisn: '1751', name: 'ARIF MUHAMMAD MUNIF', email: '1751@students.smauiiyk.sch.id', class: 'XII IPA 2', expiredAt: '2026-08-12', isPending: false },
  { nisn: '1725', name: 'ATFAL MAULANA YULIANTO', email: '1725@students.smauiiyk.sch.id', class: 'XI IPA 1', expiredAt: '2026-08-12', isPending: false },
  { nisn: '1739', name: 'DEVITASARI', email: '1739@students.smauiiyk.sch.id', class: 'XII IPS 1', expiredAt: '2026-08-12', isPending: false },
  { nisn: '1738', name: 'DIANA ARI MINARSIH', email: '1738@students.smauiiyk.sch.id', class: 'XII IPA 3', expiredAt: '2026-08-12', isPending: false },
  { nisn: '1763', name: 'AHMAD ZIDAN', email: '1763@students.smauiiyk.sch.id', class: 'X IPA 1', expiredAt: '2024-03-27', isPending: false },
  { nisn: '1800', name: 'ACHMAD KHASAN NURWAHIDIN', email: '1800@students.smauiiyk.sch.id', class: 'XII IPA 1', expiredAt: '2024-03-27', isPending: false },
  { nisn: '1812', name: 'ABDUL RAHIM ABUBAKAR', email: '1812@students.smauiiyk.sch.id', class: 'X IPS 1', expiredAt: '2024-03-27', isPending: false },
];

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { nisn } = body;

    if (!nisn) {
      return createErrorResponse('NISN harus diisi', 400);
    }

    const member = MOCK_SLIMS_DATA.find(m => m.nisn === nisn);

    if (!member) {
      return createErrorResponse('NISN tidak ditemukan di SLiMS', 404, { code: 'MEMBER_NOT_FOUND' });
    }

    const expireDate = new Date(member.expiredAt);
    const now = new Date();
    const isExpired = expireDate < now;

    return createSuccessResponse({
      nisn: member.nisn,
      nis: member.nisn,
      name: member.name,
      email: member.email,
      class: member.class,
      isExpired,
      expiredAt: member.expiredAt,
      isPending: member.isPending,
    });

  } catch (error) {
    console.error('SLiMS verification error:', error);
    return createErrorResponse('Terjadi kesalahan saat verifikasi', 500);
  }
};
