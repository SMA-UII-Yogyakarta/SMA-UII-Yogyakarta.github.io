import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { users, memberTracks, memberCards, activities, projects, announcements, notifications } from '@db/schema';
import { nanoid } from 'nanoid';
import { hash } from '@node-rs/argon2';
import QRCode from 'qrcode';

const env = process.env;
const tursoUrl = env.TURSO_URL || 'file:local.db';
const tursoToken = env.TURSO_TOKEN || '';

const client = createClient({ url: tursoUrl, authToken: tursoToken });
const db = drizzle(client);

// Default password for all test accounts
const DEFAULT_PASSWORD = 'test123';

async function generateMemberCard(userId: string, name: string, nis: string) {
  const cardNumber = `SMAUII-${Date.now().toString().slice(-8)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const qrData = JSON.stringify({ id: userId, cardNumber, name, nis });
  const qrCode = await QRCode.toDataURL(qrData, { width: 300, margin: 1 });
  
  return {
    id: nanoid(),
    userId,
    cardNumber,
    qrCode,
    issuedAt: Date.now(),
  };
}

async function createUser(data: {
  nisn: string;
  nis: string;
  name: string;
  email: string;
  githubUsername?: string;
  class: string;
  role: 'maintainer' | 'member';
  status: 'active' | 'pending' | 'rejected';
  tracks: readonly string[];
  password?: string;
  approvedBy?: string;
}) {
  const userId = nanoid();
  const now = Date.now();
  const passwordHash = data.password ? await hash(data.password, { memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1 }) : null;
  
  await db.insert(users).values({
    id: userId,
    nisn: data.nisn,
    nis: data.nis,
    name: data.name,
    email: data.email,
    githubUsername: data.githubUsername || null,
    githubId: null,
    passwordHash,
    class: data.class,
    role: data.role,
    status: data.status,
    joinedAt: now,
    approvedAt: data.status === 'active' ? now : null,
    approvedBy: data.approvedBy || null,
  });

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

async function seedEnhanced() {
  console.log('🌱 Enhanced seeding started...\n');

  try {
    // 1. Maintainer
    console.log('Creating maintainer...');
    const maintainerId = await createUser({
      nisn: '0000000001',
      nis: 'ADMIN001',
      name: 'Admin Sandikodev',
      email: 'admin@smauiilab.dev',
      githubUsername: 'sandikodev',
      class: 'Alumni',
      role: 'maintainer',
      status: 'active',
      tracks: ['software', 'network'],
      password: DEFAULT_PASSWORD,
    });
    
    const maintainerCard = await generateMemberCard(maintainerId, 'Admin Sandikodev', 'ADMIN001');
    await db.insert(memberCards).values(maintainerCard);
    console.log('✓ Maintainer created\n');

    // 2. Active Members (5)
    console.log('Creating active members...');
    const activeMembers = [
      {
        nisn: '1234567890',
        nis: '2023001',
        name: 'Ahmad Rizki Pratama',
        email: 'ahmad.rizki@student.smauiiyk.sch.id',
        githubUsername: 'ahmadrizki',
        class: 'XII IPA 1',
        tracks: ['software', 'ai'],
      },
      {
        nisn: '1234567891',
        nis: '2023002',
        name: 'Siti Nurhaliza',
        email: 'siti.nurhaliza@student.smauiiyk.sch.id',
        githubUsername: 'sitinur',
        class: 'XI IPA 2',
        tracks: ['data-science', 'ai'],
      },
      {
        nisn: '1234567892',
        nis: '2023003',
        name: 'Budi Santoso',
        email: 'budi.santoso@student.smauiiyk.sch.id',
        class: 'XII IPS 1',
        tracks: ['security', 'network'],
      },
      {
        nisn: '1234567893',
        nis: '2023004',
        name: 'Dewi Lestari',
        email: 'dewi.lestari@student.smauiiyk.sch.id',
        githubUsername: 'dewilestari',
        class: 'XII IPA 3',
        tracks: ['software'],
      },
      {
        nisn: '1234567894',
        nis: '2023005',
        name: 'Eko Prasetyo',
        email: 'eko.prasetyo@student.smauiiyk.sch.id',
        class: 'XI IPA 1',
        tracks: ['robotika', 'iot'],
      },
    ];

    const activeMemberIds = [];
    for (const member of activeMembers) {
      const userId = await createUser({
        ...member,
        role: 'member',
        status: 'active',
        password: DEFAULT_PASSWORD,
        approvedBy: maintainerId,
      });
      
      const card = await generateMemberCard(userId, member.name, member.nis);
      await db.insert(memberCards).values(card);
      activeMemberIds.push(userId);
    }
    console.log(`✓ Created ${activeMembers.length} active members\n`);

    // 3. Pending Members (3)
    console.log('Creating pending members...');
    const pendingMembers = [
      {
        nisn: '1234567895',
        nis: '2024001',
        name: 'Fajar Ramadhan',
        email: 'fajar.ramadhan@student.smauiiyk.sch.id',
        class: 'X IPA 1',
        tracks: ['software', 'game-dev'],
      },
      {
        nisn: '1234567896',
        nis: '2024002',
        name: 'Gita Savitri',
        email: 'gita.savitri@student.smauiiyk.sch.id',
        class: 'X IPA 2',
        tracks: ['ai', 'data-science'],
      },
      {
        nisn: '1234567897',
        nis: '2024003',
        name: 'Hendra Wijaya',
        email: 'hendra.wijaya@student.smauiiyk.sch.id',
        class: 'XI IPA 1',
        tracks: ['robotika'],
      },
    ];

    for (const member of pendingMembers) {
      await createUser({
        ...member,
        role: 'member',
        status: 'pending',
      });
    }
    console.log(`✓ Created ${pendingMembers.length} pending members\n`);

    // 4. Projects (10)
    console.log('Creating projects...');
    const projectsData = [
      { userId: activeMemberIds[0], title: 'Personal Portfolio Website', description: 'Built with Astro and Tailwind CSS', url: 'https://github.com/ahmadrizki/portfolio', daysAgo: 30 },
      { userId: activeMemberIds[0], title: 'Todo App with React', description: 'Simple todo app using React hooks', url: 'https://github.com/ahmadrizki/todo-react', daysAgo: 25 },
      { userId: activeMemberIds[1], title: 'Data Visualization Dashboard', description: 'COVID-19 data visualization using D3.js', url: 'https://github.com/sitinur/covid-dashboard', daysAgo: 20 },
      { userId: activeMemberIds[1], title: 'Machine Learning Model', description: 'Image classification using TensorFlow', url: null, daysAgo: 15 },
      { userId: activeMemberIds[2], title: 'Network Scanner Tool', description: 'Python-based network scanner', url: 'https://github.com/budisantoso/netscanner', daysAgo: 18 },
      { userId: activeMemberIds[3], title: 'E-commerce Website', description: 'Full-stack e-commerce with Next.js', url: 'https://github.com/dewilestari/ecommerce', daysAgo: 12 },
      { userId: activeMemberIds[3], title: 'Blog Platform', description: 'Markdown-based blog with Astro', url: 'https://github.com/dewilestari/blog', daysAgo: 8 },
      { userId: activeMemberIds[4], title: 'Arduino Robot Car', description: 'Autonomous robot car with obstacle avoidance', url: null, daysAgo: 22 },
      { userId: activeMemberIds[4], title: 'IoT Weather Station', description: 'ESP32-based weather monitoring system', url: 'https://github.com/ekoprasetyo/weather-iot', daysAgo: 10 },
      { userId: activeMemberIds[0], title: 'Discord Bot', description: 'Utility bot for Discord server', url: 'https://github.com/ahmadrizki/discord-bot', daysAgo: 5 },
    ];

    for (const project of projectsData) {
      await db.insert(projects).values({
        id: nanoid(),
        userId: project.userId,
        title: project.title,
        description: project.description,
        url: project.url,
        imageUrl: null,
        createdAt: Date.now() - project.daysAgo * 24 * 60 * 60 * 1000,
      });
    }
    console.log(`✓ Created ${projectsData.length} projects\n`);

    // 5. Activities (20)
    console.log('Creating activities...');
    const activitiesData = [
      { userId: activeMemberIds[0], type: 'contribution', title: 'First contribution to smauii-lab', description: 'Fixed typo in README', url: 'https://github.com/SMA-UII-Yogyakarta/smauii-lab/pull/1', daysAgo: 35 },
      { userId: activeMemberIds[0], type: 'workshop', title: 'Git & GitHub Workshop', description: 'Attended workshop on version control', url: null, daysAgo: 30 },
      { userId: activeMemberIds[1], type: 'event', title: 'Hackathon 2024', description: 'Participated in school hackathon', url: null, daysAgo: 28 },
      { userId: activeMemberIds[1], type: 'contribution', title: 'Added data visualization feature', description: 'Contributed to school dashboard project', url: 'https://github.com/school/dashboard/pull/5', daysAgo: 25 },
      { userId: activeMemberIds[2], type: 'workshop', title: 'Cybersecurity Basics', description: 'Workshop on network security', url: null, daysAgo: 22 },
      { userId: activeMemberIds[2], type: 'meeting', title: 'Lab Meeting - Security Track', description: 'Monthly track meeting', url: null, daysAgo: 20 },
      { userId: activeMemberIds[3], type: 'contribution', title: 'Updated documentation', description: 'Improved project documentation', url: 'https://github.com/smauii/docs/pull/3', daysAgo: 18 },
      { userId: activeMemberIds[3], type: 'workshop', title: 'Web Development Bootcamp', description: '3-day intensive bootcamp', url: null, daysAgo: 15 },
      { userId: activeMemberIds[4], type: 'event', title: 'Robotics Competition', description: 'Regional robotics competition', url: null, daysAgo: 12 },
      { userId: activeMemberIds[4], type: 'contribution', title: 'Built IoT demo', description: 'Created demo for school exhibition', url: null, daysAgo: 10 },
      { userId: activeMemberIds[0], type: 'meeting', title: 'Software Track Meeting', description: 'Discussed upcoming projects', url: null, daysAgo: 8 },
      { userId: activeMemberIds[1], type: 'workshop', title: 'Machine Learning Intro', description: 'Introduction to ML with Python', url: null, daysAgo: 7 },
      { userId: activeMemberIds[2], type: 'other', title: 'Mentoring Session', description: 'Mentored junior members', url: null, daysAgo: 6 },
      { userId: activeMemberIds[3], type: 'contribution', title: 'Code review', description: 'Reviewed pull requests', url: null, daysAgo: 5 },
      { userId: activeMemberIds[4], type: 'event', title: 'Tech Talk', description: 'Presented about IoT projects', url: null, daysAgo: 4 },
      { userId: activeMemberIds[0], type: 'workshop', title: 'React Advanced Patterns', description: 'Advanced React workshop', url: null, daysAgo: 3 },
      { userId: activeMemberIds[1], type: 'meeting', title: 'AI Track Planning', description: 'Planning AI track activities', url: null, daysAgo: 2 },
      { userId: activeMemberIds[2], type: 'contribution', title: 'Security audit', description: 'Performed security audit on school website', url: null, daysAgo: 1 },
      { userId: activeMemberIds[3], type: 'other', title: 'Blog post', description: 'Wrote tutorial on Astro', url: 'https://blog.example.com/astro-tutorial', daysAgo: 1 },
      { userId: activeMemberIds[4], type: 'workshop', title: 'Arduino Workshop', description: 'Taught Arduino basics to juniors', url: null, daysAgo: 0 },
    ];

    for (const activity of activitiesData) {
      await db.insert(activities).values({
        id: nanoid(),
        userId: activity.userId,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        url: activity.url,
        createdAt: Date.now() - activity.daysAgo * 24 * 60 * 60 * 1000,
      });
    }
    console.log(`✓ Created ${activitiesData.length} activities\n`);

    // 6. Announcements (5)
    console.log('Creating announcements...');
    const announcementsData = [
      { title: 'Welcome to Digital Lab!', content: 'Selamat datang di komunitas Digital Lab SMA UII. Mari belajar dan berkembang bersama!', daysAgo: 40 },
      { title: 'Workshop: Git & GitHub', content: 'Workshop Git & GitHub akan diadakan Sabtu, 20 Januari 2024 pukul 09.00 WIB di Lab Komputer. Daftar di link berikut: https://forms.gle/xxx', daysAgo: 30 },
      { title: 'Hackathon 2024 Registration Open', content: 'Pendaftaran Hackathon 2024 sudah dibuka! Tema tahun ini: "Technology for Education". Deadline: 15 Februari 2024.', daysAgo: 20 },
      { title: 'New Track: Game Development', content: 'Kami membuka track baru: Game Development! Bagi yang tertarik, silakan daftar melalui form pendaftaran.', daysAgo: 10 },
      { title: 'Lab Meeting - All Tracks', content: 'Lab meeting untuk semua track akan diadakan Jumat, 15 Maret 2024 pukul 15.00 WIB. Kehadiran wajib untuk semua anggota aktif.', daysAgo: 2 },
    ];

    for (const announcement of announcementsData) {
      await db.insert(announcements).values({
        id: nanoid(),
        title: announcement.title,
        content: announcement.content,
        createdBy: maintainerId,
        createdAt: Date.now() - announcement.daysAgo * 24 * 60 * 60 * 1000,
      });
    }
    console.log(`✓ Created ${announcementsData.length} announcements\n`);

    // 7. Notifications (10)
    console.log('Creating notifications...');
    const notificationsData = [
      { userId: activeMemberIds[0], message: 'Selamat! Akun kamu telah disetujui.', isRead: 1, daysAgo: 35 },
      { userId: activeMemberIds[0], message: 'Pengumuman baru: Workshop Git & GitHub', isRead: 1, daysAgo: 30 },
      { userId: activeMemberIds[1], message: 'Selamat! Akun kamu telah disetujui.', isRead: 1, daysAgo: 28 },
      { userId: activeMemberIds[1], message: 'Project kamu "Data Visualization Dashboard" mendapat 5 likes!', isRead: 0, daysAgo: 20 },
      { userId: activeMemberIds[2], message: 'Selamat! Akun kamu telah disetujui.', isRead: 1, daysAgo: 25 },
      { userId: activeMemberIds[3], message: 'Selamat! Akun kamu telah disetujui.', isRead: 1, daysAgo: 22 },
      { userId: activeMemberIds[3], message: 'Pengumuman baru: Hackathon 2024 Registration Open', isRead: 0, daysAgo: 20 },
      { userId: activeMemberIds[4], message: 'Selamat! Akun kamu telah disetujui.', isRead: 1, daysAgo: 20 },
      { userId: activeMemberIds[4], message: 'Pengumuman baru: New Track - Game Development', isRead: 0, daysAgo: 10 },
      { userId: activeMemberIds[0], message: 'Reminder: Lab Meeting besok pukul 15.00 WIB', isRead: 0, daysAgo: 1 },
    ];

    for (const notification of notificationsData) {
      await db.insert(notifications).values({
        id: nanoid(),
        userId: notification.userId,
        message: notification.message,
        isRead: notification.isRead,
        createdAt: Date.now() - notification.daysAgo * 24 * 60 * 60 * 1000,
      });
    }
    console.log(`✓ Created ${notificationsData.length} notifications\n`);

    console.log('✅ Enhanced seeding completed!\n');
    console.log('═══════════════════════════════════════');
    console.log('Summary:');
    console.log('───────────────────────────────────────');
    console.log(`👤 Users:`);
    console.log(`   - 1 maintainer (active, with card)`);
    console.log(`   - 5 active members (with cards)`);
    console.log(`   - 3 pending members`);
    console.log(`\n📦 Content:`);
    console.log(`   - ${projectsData.length} projects`);
    console.log(`   - ${activitiesData.length} activities`);
    console.log(`   - ${announcementsData.length} announcements`);
    console.log(`   - ${notificationsData.length} notifications`);
    console.log(`\n🔑 Test Accounts:`);
    console.log(`   Maintainer: NISN=0000000001, Password=${DEFAULT_PASSWORD}`);
    console.log(`   Member 1:   NISN=1234567890, Password=${DEFAULT_PASSWORD}`);
    console.log(`   Member 2:   NISN=1234567891, Password=${DEFAULT_PASSWORD}`);
    console.log(`   Pending:    NISN=1234567895 (no password yet)`);
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    if (typeof process !== 'undefined') {
      process.exit(1);
    }
  } finally {
    client.close();
  }
}

seedEnhanced();
