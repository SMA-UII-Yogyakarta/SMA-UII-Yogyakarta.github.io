import type { APIRoute } from 'astro';
import { lucia } from '@lib/auth';
import { db } from '@db';
import { users, memberTracks, memberCards, sessions } from '@db/schema';
import { eq, inArray } from 'drizzle-orm';
import { createErrorResponse, createSuccessResponse } from '@lib/api-utils';
import { nanoid } from 'nanoid';
import { hash } from '@node-rs/argon2';

export const GET: APIRoute = async ({ url, cookies }) => {
  const sessionId = cookies.get(lucia.sessionCookieName)?.value ?? null;
  
  if (!sessionId) {
    return createErrorResponse('Unauthorized', 401);
  }

  try {
    const { session, user } = await lucia.validateSession(sessionId);
    
    if (!session || !user || user.role !== 'maintainer') {
      return createErrorResponse('Forbidden', 403);
    }

    const userId = url.searchParams.get('id');
    const status = url.searchParams.get('status');
    const role = url.searchParams.get('role');

    if (userId) {
      // Get single user with details
      const targetUser = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!targetUser) {
        return createErrorResponse('User not found', 404);
      }

      const tracks = await db.query.memberTracks.findMany({
        where: eq(memberTracks.userId, userId),
      });

      const card = await db.query.memberCards.findFirst({
        where: eq(memberCards.userId, userId),
      });

      return createSuccessResponse({
        user: {
          ...targetUser,
          passwordHash: undefined,
        },
        tracks: tracks.map(t => t.track),
        memberCard: card,
      });
    }

    // Get all users with filters
    let whereCondition;
    if (status) {
      whereCondition = eq(users.status, status);
    } else if (role) {
      whereCondition = eq(users.role, role);
    }

    const allUsers = await db.query.users.findMany({
      where: whereCondition,
      orderBy: (users, { desc }) => [desc(users.joinedAt)],
    });

    // Get tracks for all users
    const userIds = allUsers.map(u => u.id);
    const allTracks = userIds.length > 0
      ? await db.query.memberTracks.findMany({
          where: inArray(memberTracks.userId, userIds),
        })
      : [];

    const tracksByUserId = new Map<string, string[]>();
    for (const track of allTracks) {
      if (!tracksByUserId.has(track.userId)) {
        tracksByUserId.set(track.userId, []);
      }
      tracksByUserId.get(track.userId)!.push(track.track);
    }

    return createSuccessResponse({
      users: allUsers.map(u => ({
        ...u,
        passwordHash: undefined,
        tracks: tracksByUserId.get(u.id) || [],
      })),
      total: allUsers.length,
    });
  } catch (error) {
    console.error('Admin users API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};

export const PATCH: APIRoute = async ({ request, cookies }) => {
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
    const { userId, status, role, name, email, class: userClass } = body;

    if (!userId) {
      return createErrorResponse('User ID is required', 400);
    }

    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!targetUser) {
      return createErrorResponse('User not found', 404);
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (role) updateData.role = role;
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (userClass) updateData.class = userClass;

    if (Object.keys(updateData).length > 0) {
      await db.update(users)
        .set(updateData)
        .where(eq(users.id, userId));
    }

    return createSuccessResponse({
      success: true,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Admin users PATCH error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
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
    const { userId } = body;

    if (!userId) {
      return createErrorResponse('User ID is required', 400);
    }

    // Prevent self-delete
    if (userId === user.id) {
      return createErrorResponse('Cannot delete your own account', 400);
    }

    await db.transaction(async (tx) => {
      await tx.delete(memberTracks).where(eq(memberTracks.userId, userId));
      await tx.delete(sessions).where(eq(sessions.userId, userId));
      await tx.delete(memberCards).where(eq(memberCards.userId, userId));
      await tx.delete(users).where(eq(users.id, userId));
    });

    return createSuccessResponse({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Admin users DELETE error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};
