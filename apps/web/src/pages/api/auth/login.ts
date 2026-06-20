import type { APIRoute } from 'astro';
import { lucia } from '@lib/auth';
import { db } from '@smauii/db';
import { users, sessions } from '@smauii/db';
import { eq, or } from 'drizzle-orm';
import { verify } from '@node-rs/argon2';
import { createErrorResponse, createSuccessResponse } from '@smauii/shared';
import { loginSchemaWithNis } from '@smauii/validation';

/**
 * Sync user data from SLiMS if configured
 * Updates name and email if changed in SLiMS
 */
async function syncSlimsData(user: { id: string; nis: string; name: string; email: string }) {
  const slimsUrl = import.meta.env.SLIMS_API_URL;
  const slimsKey = import.meta.env.SLIMS_API_KEY;

  if (!slimsUrl || !slimsKey) {
    return; // SLiMS not configured, skip sync
  }

  try {
    const res = await fetch(
      `${slimsUrl}/api.php?action=verify&nis=${encodeURIComponent(user.nis)}`,
      {
        headers: { 'X-Lab-API-Key': slimsKey },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!res.ok) {
      console.warn(`[login] SLiMS sync failed: ${res.status}`);
      return;
    }

    const data = await res.json();

    if (!data.found) {
      console.warn(`[login] SLiMS member not found: ${user.nis}`);
      return;
    }

    // Check if data changed
    const nameChanged = data.name && data.name !== user.name;
    const emailChanged = data.email && data.email !== user.email;

    if (nameChanged || emailChanged) {
      const updateData: Record<string, string> = {};
      if (nameChanged) updateData.name = data.name;
      if (emailChanged) updateData.email = data.email;

      await db.update(users)
        .set(updateData)
        .where(eq(users.id, user.id));

      console.log(`[login] Synced SLiMS data for ${user.nis}: ${Object.keys(updateData).join(', ')}`);
    }
  } catch (error) {
    console.warn('[login] SLiMS sync error:', error);
    // Don't fail login if sync fails
  }
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const parsed = loginSchemaWithNis.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return createErrorResponse(firstError.message, 400);
    }
    
    const { identifier, password } = parsed.data;

    // Find user by NIS or email (nisn is optional, may be null)
    const user = await db.query.users.findFirst({
      where: or(
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
        { code: 'PENDING_APPROVAL', details: { nis: user.nis } }
      );
    }

    if (user.status === 'inactive') {
      return createErrorResponse(
        'Akun kamu dinonaktifkan. Silakan hubungi administrator.',
        403,
        { code: 'ACCOUNT_INACTIVE' }
      );
    }

    // Sync data from SLiMS (non-blocking, don't fail login if sync fails)
    syncSlimsData(user).catch(() => {});

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
