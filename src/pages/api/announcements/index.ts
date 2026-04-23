import { db } from '@db';
import { announcements, users } from '@db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import type { APIRoute } from 'astro';
import { createErrorResponse, createSuccessResponse } from '@lib/api-utils';
import { nanoid } from 'nanoid';
import { notifyAllActiveMembers } from '@lib/notifications';
import { sendAnnouncementEmail } from '@lib/email';

export const GET: APIRoute = async ({ locals, url }) => {
  const { user } = locals;
  if (!user) return createErrorResponse('Unauthorized', 401);

  try {
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50);
    const offset = (page - 1) * limit;

    const [allAnnouncements, countResult] = await Promise.all([
      db.select({
          id: announcements.id, title: announcements.title, content: announcements.content,
          createdAt: announcements.createdAt, creatorName: users.name,
        })
        .from(announcements)
        .leftJoin(users, eq(announcements.createdBy, users.id))
        .orderBy(desc(announcements.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql`COUNT(*)` }).from(announcements),
    ]);

    return createSuccessResponse({
      announcements: allAnnouncements,
      total: Number(countResult[0]?.count || 0),
      page,
      limit,
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};

export const POST: APIRoute = async ({ locals, request }) => {
  const { user } = locals;
  if (!user || user.role !== 'maintainer') return createErrorResponse('Forbidden', 403);

  try {
    const { title, content } = await request.json();
    if (!title || !content) return createErrorResponse('Title and content required', 400);

    const id = nanoid();
    const now = Date.now();
    await db.insert(announcements).values({ id, title, content, createdBy: user.id, createdAt: now });

    // Notifikasi broadcast ke semua active members
    await notifyAllActiveMembers(`📢 Pengumuman baru: ${title}`);

    // Kirim email ke semua active members
    const activeMembers = await db.select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.status, 'active'));
    
    await Promise.allSettled(
      activeMembers
        .filter(m => m.email)
        .map(m => sendAnnouncementEmail(m.email!, title, content))
    );

    return createSuccessResponse({ id, success: true });
  } catch (error) {
    console.error('Create announcement error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};
