import type { APIRoute } from 'astro';
import { db } from '@smauii/db';
import { users } from '@smauii/db';
import { eq } from 'drizzle-orm';
import { createErrorResponse, createSuccessResponse } from '@smauii/shared';
import { signResetToken } from '@smauii/shared/jwt';
import { sendPasswordResetEmail } from '@smauii/shared';
import { forgotPasswordSchema } from '@smauii/validation';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return createErrorResponse(firstError.message, 400);
    }

    const { email } = parsed.data;

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
