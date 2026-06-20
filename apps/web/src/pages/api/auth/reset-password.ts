import type { APIRoute } from 'astro';
import { db } from '@smauii/db';
import { users, sessions } from '@smauii/db';
import { eq } from 'drizzle-orm';
import { hash } from '@node-rs/argon2';
import { createErrorResponse, createSuccessResponse } from '@smauii/shared';
import { verifyResetToken } from '@smauii/shared/jwt';
import { resetPasswordSchema } from '@smauii/validation';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return createErrorResponse(firstError.message, 400);
    }

    const { token, password } = parsed.data;

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
