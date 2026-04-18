import type { APIRoute } from 'astro';
import { lucia } from '@lib/auth';
import { db } from '@db';
import { users, sessions } from '@db/schema';
import { eq, or } from 'drizzle-orm';
import { verify } from '@node-rs/argon2';
import { createErrorResponse, createSuccessResponse } from '@lib/api-utils';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    // Validation
    if (!identifier) {
      return createErrorResponse('NIS atau Email harus diisi', 400, { code: 'MISSING_IDENTIFIER' });
    }

    if (!password) {
      return createErrorResponse('Password harus diisi', 400, { code: 'MISSING_PASSWORD' });
    }

    // Find user by NISN, NIS, or email
    const user = await db.query.users.findFirst({
      where: or(
        eq(users.nisn, identifier),
        eq(users.nis, identifier),
        eq(users.email, identifier),
      ),
    });

    if (!user) {
      return createErrorResponse('NIS/Email tidak ditemukan', 401, { code: 'USER_NOT_FOUND' });
    }

    // Check if password hash exists
    if (!user.passwordHash) {
      return createErrorResponse(
        'Akun ini belum diatur password. Silakan hubungi administrator untuk mengatur password.',
        401,
        { code: 'NO_PASSWORD_SET' }
      );
    }

    // Verify password
    const validPassword = await verify(user.passwordHash, password);
    if (!validPassword) {
      return createErrorResponse('Invalid password', 401, { code: 'INVALID_PASSWORD' });
    }

    // Check if user is approved
    if (user.status === 'pending') {
      return createErrorResponse(
        'Pendaftaran kamu masih dalam proses peninjauan.',
        403,
        { code: 'PENDING_APPROVAL', details: { nisn: user.nisn } }
      );
    }

    if (user.status === 'inactive') {
      return createErrorResponse(
        'Akun kamu dinonaktifkan. Silakan hubungi administrator.',
        403,
        { code: 'ACCOUNT_INACTIVE' }
      );
    }

    // Invalidate all existing sessions for this user (session fixation protection)
    await db.delete(sessions).where(eq(sessions.userId, user.id));

    // Create new session
    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    
    cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    return createSuccessResponse({
      success: true,
      message: 'Login berhasil',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return createErrorResponse('Terjadi kesalahan saat login', 500);
  }
};
