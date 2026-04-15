import type { APIRoute } from 'astro';
import { db } from '@db';
import { users, memberTracks } from '@db/schema';
import { registerSchema } from '@lib/validation';
import { nanoid } from 'nanoid';
import { ZodError } from 'zod';
import { createErrorResponse, createSuccessResponse } from '@lib/api-utils';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    // Validate input
    const validated = registerSchema.parse(body);

    // Check if user already exists (duplicate check before insert)
    const existing = await db.query.users.findFirst({
      where: (users, { or, eq }) => or(
        eq(users.nisn, validated.nisn),
        eq(users.nis, validated.nis),
        eq(users.email, validated.email)
      ),
    });

    if (existing) {
      return createErrorResponse(
        'User dengan NISN/NIS/Email ini sudah terdaftar',
        409,
        { code: 'USER_EXISTS' }
      );
    }

    // Use transaction for atomic operation
    const userId = nanoid();
    const now = Date.now();

    await db.transaction(async (tx) => {
      // Create user
      await tx.insert(users).values({
        id: userId,
        nisn: validated.nisn,
       nis: validated.nis,
        name: validated.name,
        email: validated.email,
        githubUsername: validated.githubUsername || null,
        class: validated.class,
        role: 'member',
        status: 'pending',
        joinedAt: now,
      });

      // Add tracks
      for (const track of validated.tracks) {
        await tx.insert(memberTracks).values({
          id: nanoid(),
          userId,
          track,
          joinedAt: now,
        });
      }
    });

    return createSuccessResponse({
      success: true,
      message: 'Pendaftaran berhasil! Menunggu persetujuan maintainer.'
    }, 201);

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};
      error.issues.forEach(issue => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
      });
      return createErrorResponse(
        'Validasi gagal',
        422,
        { code: 'VALIDATION_ERROR', details: fieldErrors }
      );
    }
    
    return createErrorResponse('Terjadi kesalahan saat pendaftaran', 500);
  }
};

export const GET: APIRoute = async ({ url }) => {
  const identifier = url.searchParams.get('identifier') || url.searchParams.get('nisn');
  const checkStatus = url.searchParams.get('checkStatus') === 'true';

  // Check status endpoint
  if (checkStatus && identifier) {
    try {
      const user = await db.query.users.findFirst({
        where: (users, { or, eq }) => or(
          eq(users.nisn, identifier),
          eq(users.email, identifier),
        ),
        with: {
          tracks: true,
        },
      });

      if (!user) {
        return createErrorResponse('Pendaftaran tidak ditemukan', 404);
      }

      return createSuccessResponse({
        nisn: user.nisn,
        name: user.name,
        email: user.email,
        class: user.class,
        status: user.status,
        tracks: user.tracks.map(t => t.track),
        joinedAt: user.joinedAt ? new Date(user.joinedAt).toISOString() : null,
      });
    } catch (error) {
      console.error('Check status error:', error);
      return createErrorResponse('Terjadi kesalahan', 500);
    }
  }

  // Check duplicate endpoint
  if (!identifier) {
    return createErrorResponse('Parameter identifier diperlukan', 400);
  }

  try {
    const existing = await db.query.users.findFirst({
      where: (users, { or, eq }) => or(
        eq(users.nisn, identifier),
        eq(users.email, identifier),
      ),
    });

    if (existing) {
      return createErrorResponse(
        'User dengan NISN/NIS/Email ini sudah terdaftar',
        409,
        { code: 'USER_EXISTS' }
      );
    }

    return createSuccessResponse({ available: true }, 200);
  } catch (error) {
    console.error('Check user error:', error);
    return createErrorResponse('Terjadi kesalahan', 500);
  }
};
