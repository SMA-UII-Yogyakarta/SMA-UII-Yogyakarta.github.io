import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { users, memberTracks, memberCards, activities } from '@db/schema';
import type { NewUser } from '@db/schema';
import { nanoid } from 'nanoid';
import QRCode from 'qrcode';

// Load env - compatible with Node.js and Bun
const env = typeof process !== 'undefined' ? process.env : (Bun?.env || {});
const tursoUrl = env.PUBLIC_TURSO_URL || 'file:local.db';
const tursoToken = env.PUBLIC_TURSO_TOKEN || '';

const client = createClient({
  url: tursoUrl,
  authToken: tursoToken,
});

const db = drizzle(client);

// Single source of truth for seed data
const SEED_DATA = {
  maintainer: {
    nisn: '0000000001',
    nis: 'ADMIN001',
    name: 'Sandikodev',
    email: 'sandikodev@example.com',
    githubUsername: 'sandikodev',
    class: 'Alumni',
    role: 'maintainer' as const,
    tracks: ['software', 'network'] as const,
  },
  pendingMembers: [
    {
      nisn: '1234567890',
      nis: '2024001',
      name: 'Ahmad Rizki',
      email: 'ahmad.rizki@student.smauiiyk.sch.id',
      class: 'XII IPA 1',
      tracks: ['robotika', 'ai'] as const,
    },
    {
      nisn: '1234567891',
      nis: '2024002',
      name: 'Siti Nurhaliza',
      email: 'siti.nurhaliza@student.smauiiyk.sch.id',
      class: 'XI IPA 2',
      tracks: ['data-science', 'ai'] as const,
    },
    {
      nisn: '1234567892',
      nis: '2024003',
      name: 'Budi Santoso',
      email: 'budi.santoso@student.smauiiyk.sch.id',
      class: 'XII IPS 1',
      tracks: ['software', 'security'] as const,
    },
  ],
  activeMember: {
    nisn: '1234567893',
    nis: '2023001',
    name: 'Dewi Lestari',
    email: 'dewi.lestari@student.smauiiyk.sch.id',
    githubUsername: 'dewilestari',
    class: 'XII IPA 3',
    tracks: ['software'] as const,
    activities: [
      {
        type: 'contribution' as const,
        title: 'First contribution to smauii-lab',
        description: 'Fixed typo in README.md',
        url: 'https://github.com/SMA-UII-Yogyakarta/SMA-UII-Yogyakarta.github.io/pull/1',
        daysAgo: 20,
      },
      {
        type: 'attendance' as const,
        title: 'Workshop: Git & GitHub Basics',
        description: 'Attended workshop on version control',
        url: null,
        daysAgo: 15,
      },
      {
        type: 'project' as const,
        title: 'Created personal portfolio',
        description: 'Built portfolio website using Astro',
        url: 'https://github.com/dewilestari/portfolio',
        daysAgo: 10,
      },
    ],
  },
} as const;

async function generateMemberCard(userId: string, name: string, nis: string) {
  const cardNumber = `SMAUII-${Date.now().toString().slice(-8)}`;
  const qrData = JSON.stringify({ id: userId, cardNumber, name });
  const qrCode = await QRCode.toDataURL(qrData);
  
  return {
    id: nanoid(),
    userId,
    cardNumber,
    qrCode,
    issuedAt: Date.now(),
  };
}

async function createUser(data: typeof SEED_DATA.maintainer | typeof SEED_DATA.pendingMembers[0] | typeof SEED_DATA.activeMember, status: 'active' | 'pending', role: 'maintainer' | 'member', approvedBy?: string) {
  const userId = nanoid();
  const now = Date.now();
  
  await db.insert(users).values({
    id: userId,
    nisn: data.nisn,
    nis: data.nis,
    name: data.name,
    email: data.email,
    githubUsername: 'githubUsername' in data ? data.githubUsername : null,
    githubId: null,
    class: data.class,
    role,
    status,
    joinedAt: now,
    approvedAt: status === 'active' ? now : null,
    approvedBy: approvedBy || null,
  });

  // Add tracks
  for (const track of data.tracks) {
    await db.insert(memberTracks).values({
      id: nanoid(),
      userId,
      track,
      joinedAt: now,
    });
  }

  return userId;
}

async function seed() {
  console.log('🌱 Seeding database...\n');

  try {
    // 1. Create maintainer
    console.log('Creating maintainer...');
    const maintainerId = await createUser(SEED_DATA.maintainer, 'active', 'maintainer');
    
    // Generate card for maintainer
    const maintainerCard = await generateMemberCard(
      maintainerId,
      SEED_DATA.maintainer.name,
      SEED_DATA.maintainer.nis
    );
    await db.insert(memberCards).values(maintainerCard);
    
    console.log('✓ Maintainer created with card\n');

    // 2. Create pending members
    console.log('Creating pending members...');
    for (const member of SEED_DATA.pendingMembers) {
      await createUser(member, 'pending', 'member');
    }
    console.log(`✓ Created ${SEED_DATA.pendingMembers.length} pending members\n`);

    // 3. Create active member with card and activities
    console.log('Creating active member...');
    const activeMemberId = await createUser(
      SEED_DATA.activeMember,
      'active',
      'member',
      maintainerId
    );

    // Generate card
    const activeCard = await generateMemberCard(
      activeMemberId,
      SEED_DATA.activeMember.name,
      SEED_DATA.activeMember.nis
    );
    await db.insert(memberCards).values(activeCard);

    // Add activities
    for (const activity of SEED_DATA.activeMember.activities) {
      await db.insert(activities).values({
        id: nanoid(),
        userId: activeMemberId,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        url: activity.url,
        createdAt: Date.now() - activity.daysAgo * 24 * 60 * 60 * 1000,
      });
    }

    console.log('✓ Active member with card and activities created\n');

    console.log('✅ Database seeded successfully!\n');
    console.log('Summary:');
    console.log(`- 1 maintainer (${SEED_DATA.maintainer.name})`);
    console.log(`- ${SEED_DATA.pendingMembers.length} pending members`);
    console.log('- 1 active member with card');
    console.log(`- ${SEED_DATA.activeMember.activities.length} activities\n`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    if (typeof process !== 'undefined') {
      process.exit(1);
    }
  } finally {
    client.close();
  }
}

seed();
