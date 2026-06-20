import type { APIRoute } from 'astro';
import { db } from '@smauii/db';
import { users, memberTracks, memberCards, sessions, activities, projects, notifications, learningProgress, readingSessions } from '@smauii/db';
import { eq, inArray, and } from 'drizzle-orm';
import { createErrorResponse, createSuccessResponse } from '@smauii/shared';
import { updateUserSchema, deleteUserSchema } from '@smauii/validation';

export const GET: APIRoute = async ({ url, locals }) => {
  const { user } = locals;
  if (!user || user.role !== 'maintainer') {
    return createErrorResponse('Forbidden', 403);
  }

  try {
    const userId = url.searchParams.get('id');
    const status = url.searchParams.get('status');
    const role = url.searchParams.get('role');

    if (userId) {
      const targetUser = await db.query.users.findFirst({ where: eq(users.id, userId) });
      if (!targetUser) return createErrorResponse('User not found', 404);

      const tracks = await db.query.memberTracks.findMany({ where: eq(memberTracks.userId, userId) });
      const card = await db.query.memberCards.findFirst({ where: eq(memberCards.userId, userId) });

      return createSuccessResponse({
        user: { ...targetUser, passwordHash: undefined },
        tracks: tracks.map(t => t.track),
        memberCard: card,
      });
    }

    const track = url.searchParams.get('track');
    const userClass = url.searchParams.get('class');

    const conditions = [];
    if (status) conditions.push(eq(users.status, status));
    if (role) conditions.push(eq(users.role, role));
    if (userClass) conditions.push(eq(users.class, userClass));

    let allUsers = await db.query.users.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: (users, { desc }) => [desc(users.joinedAt)],
    });

    if (track && allUsers.length > 0) {
      const userIds = allUsers.map(u => u.id);
      const trackUsers = await db.query.memberTracks.findMany({
        where: and(
          inArray(memberTracks.userId, userIds),
          eq(memberTracks.track, track)
        ),
      });
      const trackUserIds = new Set(trackUsers.map(t => t.userId));
      allUsers = allUsers.filter(u => trackUserIds.has(u.id));
    }

    const userIds = allUsers.map(u => u.id);
    const allTracks = userIds.length > 0
      ? await db.query.memberTracks.findMany({ where: inArray(memberTracks.userId, userIds) })
      : [];

    const tracksByUserId = new Map<string, string[]>();
    for (const track of allTracks) {
      if (!tracksByUserId.has(track.userId)) tracksByUserId.set(track.userId, []);
      tracksByUserId.get(track.userId)!.push(track.track);
    }

    return createSuccessResponse({
      users: allUsers.map(u => ({ ...u, passwordHash: undefined, tracks: tracksByUserId.get(u.id) || [] })),
      total: allUsers.length,
    });
  } catch (error) {
    console.error('Admin users GET error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};

export const PATCH: APIRoute = async ({ request, locals }) => {
  const { user } = locals;
  if (!user || user.role !== 'maintainer') {
    return createErrorResponse('Forbidden', 403);
  }

  try {
    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return createErrorResponse(firstError.message, 400);
    }

    const { userId, status, role, name, email, class: userClass } = parsed.data;
    if (!userId) return createErrorResponse('User ID is required', 400);

    const targetUser = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!targetUser) return createErrorResponse('User not found', 404);

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (role) updateData.role = role;
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (userClass) updateData.class = userClass;

    if (Object.keys(updateData).length > 0) {
      await db.update(users).set(updateData).where(eq(users.id, userId));
    }

    return createSuccessResponse({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Admin users PATCH error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  const { user } = locals;
  if (!user || user.role !== 'maintainer') {
    return createErrorResponse('Forbidden', 403);
  }

  try {
    const body = await request.json();
    const parsed = deleteUserSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return createErrorResponse(firstError.message, 400);
    }
    
    const { userId } = parsed.data;
    if (userId === user.id) return createErrorResponse('Cannot delete your own account', 400);

    await db.transaction(async (tx) => {
      await tx.delete(activities).where(eq(activities.userId, userId));
      await tx.delete(projects).where(eq(projects.userId, userId));
      await tx.delete(notifications).where(eq(notifications.userId, userId));
      await tx.delete(learningProgress).where(eq(learningProgress.userId, userId));
      await tx.delete(readingSessions).where(eq(readingSessions.userId, userId));
      await tx.delete(memberTracks).where(eq(memberTracks.userId, userId));
      await tx.delete(sessions).where(eq(sessions.userId, userId));
      await tx.delete(memberCards).where(eq(memberCards.userId, userId));
      await tx.delete(users).where(eq(users.id, userId));
    });

    return createSuccessResponse({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin users DELETE error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};
