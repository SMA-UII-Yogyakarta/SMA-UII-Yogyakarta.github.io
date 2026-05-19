import { eq, and, desc, sql, count, not, inArray } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { nanoid } from 'nanoid';
import * as schema from './schema';

type Db = LibSQLDatabase<typeof schema>;

export async function checkAndAwardBadges(userId: string, db: Db): Promise<string[]> {
  const newlyAwarded: string[] = [];

  const [activityCount, projectCount, lessonCount] = await Promise.all([
    db.select({ c: count() }).from(schema.activities).where(eq(schema.activities.userId, userId)).then(r => r[0]?.c ?? 0),
    db.select({ c: count() }).from(schema.projects).where(eq(schema.projects.userId, userId)).then(r => r[0]?.c ?? 0),
    db.select({ c: count() }).from(schema.learningProgress).where(eq(schema.learningProgress.userId, userId)).then(r => r[0]?.c ?? 0),
  ]);

  const streak = await calculateStreak(userId, db);

  const earnedBadgeIds = new Set(
    (await db.select({ badgeId: schema.userBadges.badgeId })
      .from(schema.userBadges)
      .where(eq(schema.userBadges.userId, userId)))
      .map(r => r.badgeId)
  );

  const allBadges = await db.select().from(schema.badges);

  const counts: Record<string, number> = {
    activity_count: activityCount,
    project_count: projectCount,
    lesson_count: lessonCount,
    streak_days: streak,
  };

  for (const badge of allBadges) {
    if (badge.criteriaType === 'manual') continue;
    if (earnedBadgeIds.has(badge.id)) continue;

    const currentValue = counts[badge.criteriaType] ?? 0;
    if (badge.threshold !== null && currentValue >= badge.threshold) {
      await db.insert(schema.userBadges).values({
        id: nanoid(),
        userId,
        badgeId: badge.id,
        awardedAt: Date.now(),
        metadata: JSON.stringify({ triggerValue: currentValue, criteriaType: badge.criteriaType }),
      });
      newlyAwarded.push(badge.id);
    }
  }

  if (newlyAwarded.length > 0) {
    const totalPoints = await db
      .select({ sum: sql<number>`COALESCE(SUM(${schema.badges.points}), 0)` })
      .from(schema.userBadges)
      .innerJoin(schema.badges, eq(schema.userBadges.badgeId, schema.badges.id))
      .where(eq(schema.userBadges.userId, userId))
      .then(r => r[0]?.sum ?? 0);

    await db.update(schema.users)
      .set({ badgeScore: Number(totalPoints) })
      .where(eq(schema.users.id, userId));
  }

  return newlyAwarded;
}

async function calculateStreak(userId: string, db: Db): Promise<number> {
  const activities = await db
    .select({ createdAt: schema.activities.createdAt })
    .from(schema.activities)
    .where(eq(schema.activities.userId, userId))
    .orderBy(desc(schema.activities.createdAt))
    .limit(100);

  const sessions = await db
    .select({ startedAt: schema.readingSessions.startedAt })
    .from(schema.readingSessions)
    .where(eq(schema.readingSessions.userId, userId))
    .orderBy(desc(schema.readingSessions.startedAt))
    .limit(100);

  const uniqueDays = new Set<string>();
  for (const a of activities) {
    uniqueDays.add(new Date(a.createdAt).toISOString().slice(0, 10));
  }
  for (const s of sessions) {
    uniqueDays.add(new Date(s.startedAt).toISOString().slice(0, 10));
  }

  const sortedDays = [...uniqueDays].sort().reverse();
  if (sortedDays.length === 0) return 0;

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (sortedDays[0] !== today && sortedDays[0] !== yesterday) return 0;

  let streak = 0;
  const startDate = new Date(sortedDays[0]);
  for (let i = 0; i < sortedDays.length; i++) {
    const expected = new Date(startDate);
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().slice(0, 10);
    if (sortedDays[i] === expectedStr) streak++;
    else break;
  }

  return streak;
}

export async function getLeaderboard(db: Db, limit = 50) {
  return db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      avatarUrl: schema.users.avatarUrl,
      class: schema.users.class,
      badgeScore: schema.users.badgeScore,
    })
    .from(schema.users)
    .where(eq(schema.users.status, 'active'))
    .orderBy(desc(schema.users.badgeScore))
    .limit(limit);
}

export async function getUserBadges(userId: string, db: Db) {
  return db
    .select({
      id: schema.userBadges.id,
      awardedAt: schema.userBadges.awardedAt,
      metadata: schema.userBadges.metadata,
      badge: {
        id: schema.badges.id,
        name: schema.badges.name,
        description: schema.badges.description,
        icon: schema.badges.icon,
        tier: schema.badges.tier,
        category: schema.badges.category,
        points: schema.badges.points,
      },
    })
    .from(schema.userBadges)
    .innerJoin(schema.badges, eq(schema.userBadges.badgeId, schema.badges.id))
    .where(eq(schema.userBadges.userId, userId))
    .orderBy(desc(schema.userBadges.awardedAt));
}
