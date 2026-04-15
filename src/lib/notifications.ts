import { db } from '@db';
import { notifications, users } from '@db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

/**
 * Buat satu notifikasi untuk satu user.
 */
export async function createNotification(userId: string, message: string): Promise<void> {
  await db.insert(notifications).values({
    id: nanoid(),
    userId,
    message,
    isRead: 0,
    createdAt: Date.now(),
  });
}

/**
 * Kirim notifikasi ke semua member dengan status 'active'.
 * Gunakan untuk broadcast pengumuman, dll.
 */
export async function notifyAllActiveMembers(message: string): Promise<void> {
  const members = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.status, 'active'));

  if (members.length === 0) return;

  const now = Date.now();
  await db.insert(notifications).values(
    members.map((m) => ({
      id: nanoid(),
      userId: m.id,
      message,
      isRead: 0,
      createdAt: now,
    }))
  );
}
