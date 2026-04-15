import { db } from '@db';
import { announcements, users, notifications } from '@db/schema';
import { eq, desc } from 'drizzle-orm';
import type { APIRoute } from 'astro';
import { createErrorResponse, createSuccessResponse } from '@lib/api-utils';
import { nanoid } from 'nanoid';

export const GET: APIRoute = async ({ locals }) => {
  const { session, user } = locals;
  if (!session || !user) return createErrorResponse('Unauthorized', 401);

  try {
    const allAnnouncements = await db
      .select({ id: announcements.id, title: announcements.title, content: announcements.content, createdAt: announcements.createdAt, creatorName: users.name })
      .from(announcements)
      .leftJoin(users, eq(announcements.createdBy, users.id))
      .orderBy(desc(announcements.createdAt));

    return createSuccessResponse(allAnnouncements);
  } catch (error) {
    console.error('Get announcements error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};

export const POST: APIRoute = async ({ locals, request }) => {
  const { session, user } = locals;
  if (!session || !user || user.role !== 'maintainer') return createErrorResponse('Forbidden', 403);

  try {
    const { title, content } = await request.json();
    if (!title || !content) return createErrorResponse('Title and content required', 400);

    const id = nanoid();
    const now = Date.now();
    await db.insert(announcements).values({ id, title, content, createdBy: user.id, createdAt: now });

    const allMembers = await db.select({ id: users.id }).from(users).where(eq(users.status, 'active'));
    if (allMembers.length > 0) {
      await db.insert(notifications).values(
        allMembers.map(m => ({ id: nanoid(), userId: m.id, message: `New announcement: ${title}`, isRead: 0, createdAt: now }))
      );
    }

    return createSuccessResponse({ id, success: true });
  } catch (error) {
    console.error('Create announcement error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};
