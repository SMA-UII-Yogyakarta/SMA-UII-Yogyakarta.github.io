import { db } from '../../src/db';
import { users, sessions, projects, activities, announcements, notifications, memberCards, memberTracks } from '../../src/db/schema';

export async function resetDatabase() {
  // Delete all data in reverse dependency order
  await db.delete(sessions);
  await db.delete(notifications);
  await db.delete(activities);
  await db.delete(announcements);
  await db.delete(projects);
  await db.delete(memberCards);
  await db.delete(memberTracks);
  await db.delete(users);
}

export async function seedTestData() {
  const { hash } = await import('@node-rs/argon2');
  const { nanoid } = await import('nanoid');
  
  const passwordHash = await hash('test123', {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  // Seed minimal test data
  const maintainerId = nanoid();
  const memberId = nanoid();
  const pendingId = nanoid();

  await db.insert(users).values([
    {
      id: maintainerId,
      nisn: '0000000001',
      nis: 'ADMIN001',
      name: 'Test Maintainer',
      email: 'maintainer@test.com',
      githubUsername: 'testmaintainer',
      passwordHash,
      class: 'Alumni',
      role: 'maintainer',
      status: 'active',
      joinedAt: Date.now(),
      approvedAt: Date.now(),
    },
    {
      id: memberId,
      nisn: '1234567890',
      nis: '2023001',
      name: 'Ahmad Rizki Pratama',
      email: 'member@test.com',
      githubUsername: 'testmember',
      passwordHash,
      class: 'XII IPA 1',
      role: 'member',
      status: 'active',
      joinedAt: Date.now(),
      approvedAt: Date.now(),
      approvedBy: maintainerId,
    },
    {
      id: pendingId,
      nisn: '9999999999',
      nis: '2023999',
      name: 'Pending Member',
      email: 'pending@test.com',
      githubUsername: 'pendingmember',
      passwordHash,
      class: 'XII IPA 2',
      role: 'member',
      status: 'pending',
      joinedAt: Date.now(),
    },
  ]);

  // Add sample project
  await db.insert(projects).values({
    id: nanoid(),
    userId: memberId,
    title: 'Personal Portfolio',
    description: 'My personal website',
    url: 'https://github.com/test/portfolio',
    createdAt: Date.now(),
  });

  return { maintainerId, memberId, pendingId };
}
