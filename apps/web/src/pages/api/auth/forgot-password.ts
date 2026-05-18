import type { APIRoute } from 'astro';
import { db } from '@smauii/db';
import { users } from '@smauii/db';
import { eq } from 'drizzle-orm';
import { createErrorResponse, createSuccessResponse } from '@smauii/shared';
import { signResetToken } from '@smauii/shared';
import { sendPasswordResetEmail } from '@smauii/shared';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return createErrorResponse('Email harus diisi', 400, { code: 'MISSING_EMAIL' });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return createSuccessResponse({
        message: 'Jika email terdaftar, tautan reset akan dikirim.',
      });
    }

    if (!user.passwordHash) {
      return createSuccessResponse({
        message: 'Jika email terdaftar, tautan reset akan dikirim.',
      });
    }

    const token = await signResetToken(user.id);

    await sendPasswordResetEmail(user.email, user.name, token);

    return createSuccessResponse({
      message: 'Jika email terdaftar, tautan reset telah dikirim.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return createErrorResponse('Terjadi kesalahan saat memproses permintaan', 500);
  }
};
