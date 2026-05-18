import type { APIRoute } from 'astro';
import { db } from '@smauii/db';
import { users } from '@smauii/db';
import { eq } from 'drizzle-orm';
import { hash } from '@node-rs/argon2';
import { createErrorResponse, createSuccessResponse } from '@smauii/shared';
import { setPasswordSchema } from '@smauii/validation';

export const POST: APIRoute = async ({ request, locals }) => {
  const { user } = locals;
  if (!user || user.role !== 'maintainer') {
    return createErrorResponse('Forbidden', 403);
  }

  try {
    const body = await request.json();
    const parsed = setPasswordSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return createErrorResponse(firstError.message, 400);
    }

    const { userId, password } = parsed.data;

    const targetUser = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!targetUser) return createErrorResponse('User not found', 404);

    const passwordHash = await hash(password, { memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1 });
    await db.update(users).set({ passwordHash }).where(eq(users.id, userId));

    return createSuccessResponse({ success: true, message: 'Password berhasil diatur' });
  } catch (error) {
    console.error('Set password error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};
