import type { APIRoute } from 'astro';
import { db } from '@db';
import { users } from '@db/schema';
import { eq } from 'drizzle-orm';
import { createErrorResponse, createSuccessResponse } from '@lib/api-utils';
import { signResetToken } from '@lib/jwt';
import { sendPasswordResetEmail } from '@lib/email';

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
