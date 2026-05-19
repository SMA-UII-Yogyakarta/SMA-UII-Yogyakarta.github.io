import type { APIRoute } from 'astro';
import { db } from '@smauii/db';
import { users, sessions } from '@smauii/db';
import { eq } from 'drizzle-orm';
import { hash } from '@node-rs/argon2';
import { createErrorResponse, createSuccessResponse } from '@smauii/shared';
import { verifyResetToken } from '@smauii/shared/jwt';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token) {
      return createErrorResponse('Token tidak ditemukan', 400, { code: 'MISSING_TOKEN' });
    }

    if (!password || password.length < 8) {
      return createErrorResponse('Password minimal 8 karakter', 400, { code: 'WEAK_PASSWORD' });
    }

    const userId = await verifyResetToken(token);

    if (!userId) {
      return createErrorResponse(
        'Tautan reset tidak valid atau sudah kedaluwarsa.',
        400,
        { code: 'INVALID_TOKEN' }
      );
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return createErrorResponse(
        'Tautan reset tidak valid atau sudah kedaluwarsa.',
        400,
        { code: 'INVALID_TOKEN' }
      );
    }

    const passwordHash = await hash(password);

    await db.update(users)
      .set({ passwordHash })
      .where(eq(users.id, userId));

    await db.delete(sessions).where(eq(sessions.userId, userId));

    return createSuccessResponse({
      message: 'Password berhasil direset. Silakan login dengan password baru.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return createErrorResponse('Terjadi kesalahan saat mereset password', 500);
  }
};
