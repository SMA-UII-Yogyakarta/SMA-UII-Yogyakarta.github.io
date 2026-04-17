import type { APIRoute } from 'astro';
import { db } from '@db';
import { users } from '@db/schema';
import { eq } from 'drizzle-orm';
import { createErrorResponse, createSuccessResponse } from '@lib/api-utils';

export const GET: APIRoute = async ({ locals }) => {
  const { user } = locals;

  if (!user) {
    return createErrorResponse('Unauthorized', 401);
  }

  try {    // Get full user data
    const fullUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    if (!fullUser) {
      return createErrorResponse('User not found', 404);
    }

    // Return user data (exclude sensitive fields)
    const userData = {
      id: fullUser.id,
      nisn: fullUser.nisn,
      nis: fullUser.nis,
      name: fullUser.name,
      email: fullUser.email,
      githubUsername: fullUser.githubUsername,
      githubId: fullUser.githubId,
      class: fullUser.class,
      role: fullUser.role,
      status: fullUser.status,
      joinedAt: fullUser.joinedAt,
      approvedAt: fullUser.approvedAt,
      approvedBy: fullUser.approvedBy,
    };

    return createSuccessResponse(userData);
  } catch (error) {
    console.error('Session validation error:', error);
    return createErrorResponse('Unauthorized', 401);
  }
};
