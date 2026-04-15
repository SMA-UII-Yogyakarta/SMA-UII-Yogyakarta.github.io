import type { APIRoute } from 'astro';
import { lucia } from '@lib/auth';
import { db } from '@db';
import { users } from '@db/schema';
import { eq } from 'drizzle-orm';
import { hash } from '@node-rs/argon2';
import { createErrorResponse, createSuccessResponse } from '@lib/api-utils';

export const POST: APIRoute = async ({ request, cookies }) => {
  const sessionId = cookies.get(lucia.sessionCookieName)?.value ?? null;
  
  if (!sessionId) {
    return createErrorResponse('Unauthorized', 401);
  }

  try {
    const { session, user } = await lucia.validateSession(sessionId);
    
    if (!session || !user || user.role !== 'maintainer') {
      return createErrorResponse('Forbidden', 403);
    }

    const body = await request.json();
    const { userId, password } = body;

    if (!userId || !password) {
      return createErrorResponse('Missing required fields', 400);
    }

    if (password.length < 6) {
      return createErrorResponse('Password minimal 6 karakter', 400, { code: 'PASSWORD_TOO_SHORT' });
    }

    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!targetUser) {
      return createErrorResponse('User not found', 404);
    }

    // Hash password
    const passwordHash = await hash(password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    // Update password
    await db.update(users)
      .set({ passwordHash })
      .where(eq(users.id, userId));

    return createSuccessResponse({
      success: true,
      message: 'Password berhasil diatur'
    });

  } catch (error) {
    console.error('Set password error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};
