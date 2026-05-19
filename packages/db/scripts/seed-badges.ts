import { db } from '../src';
import { badges } from '../src/schema';
import { nanoid } from 'nanoid';

const BADGE_DEFINITIONS = [
  // Activity badges
  { name: 'Kontributor Pemula', description: 'Log 5 aktivitas pertama', icon: '🏅', tier: 'bronze', category: 'activity', criteriaType: 'activity_count', threshold: 5, points: 10 },
  { name: 'Kontributor Rajin', description: 'Log 20 aktivitas', icon: '🥈', tier: 'silver', category: 'activity', criteriaType: 'activity_count', threshold: 20, points: 25 },
  { name: 'Kontributor Pro', description: 'Log 50 aktivitas', icon: '🥇', tier: 'gold', category: 'activity', criteriaType: 'activity_count', threshold: 50, points: 50 },
  { name: 'Kontributor Legendaris', description: 'Log 100 aktivitas', icon: '💎', tier: 'diamond', category: 'activity', criteriaType: 'activity_count', threshold: 100, points: 100 },

  // Project badges
  { name: 'Proyek Pertama', description: 'Buat proyek pertama', icon: '🚀', tier: 'bronze', category: 'project', criteriaType: 'project_count', threshold: 1, points: 10 },
  { name: 'Builder Aktif', description: 'Buat 5 proyek', icon: '🥈', tier: 'silver', category: 'project', criteriaType: 'project_count', threshold: 5, points: 25 },
  { name: 'Builder Pro', description: 'Buat 15 proyek', icon: '🥇', tier: 'gold', category: 'project', criteriaType: 'project_count', threshold: 15, points: 50 },
  { name: 'Builder Legendaris', description: 'Buat 30 proyek', icon: '💎', tier: 'diamond', category: 'project', criteriaType: 'project_count', threshold: 30, points: 100 },

  // Learning badges
  { name: 'Pelajar Rajin', description: 'Selesaikan 3 lesson', icon: '📚', tier: 'bronze', category: 'learning', criteriaType: 'lesson_count', threshold: 3, points: 10 },
  { name: 'Pelajar Tekun', description: 'Selesaikan 10 lesson', icon: '🥈', tier: 'silver', category: 'learning', criteriaType: 'lesson_count', threshold: 10, points: 25 },
  { name: 'Pelajar Master', description: 'Selesaikan 25 lesson', icon: '🥇', tier: 'gold', category: 'learning', criteriaType: 'lesson_count', threshold: 25, points: 50 },

  // Streak badges
  { name: 'Streak 3 Hari', description: 'Aktif 3 hari berturut-turut', icon: '🔥', tier: 'bronze', category: 'streak', criteriaType: 'streak_days', threshold: 3, points: 10 },
  { name: 'Streak 7 Hari', description: 'Aktif 7 hari berturut-turut', icon: '🥈', tier: 'silver', category: 'streak', criteriaType: 'streak_days', threshold: 7, points: 25 },
  { name: 'Streak 30 Hari', description: 'Aktif 30 hari berturut-turut', icon: '🥇', tier: 'gold', category: 'streak', criteriaType: 'streak_days', threshold: 30, points: 50 },
  { name: 'Streak 100 Hari', description: 'Aktif 100 hari berturut-turut', icon: '💎', tier: 'diamond', category: 'streak', criteriaType: 'streak_days', threshold: 100, points: 100 },

  // Special badges (manual award)
  { name: 'Mentor Muda', description: 'Membantu member lain belajar', icon: '🌟', tier: 'gold', category: 'community', criteriaType: 'manual', threshold: null, points: 50 },
  { name: 'Juara Hackathon', description: 'Menang hackathon', icon: '🏆', tier: 'gold', category: 'special', criteriaType: 'manual', threshold: null, points: 50 },
];

async function seedBadges() {
  console.log('Seeding badges...');

  for (const badge of BADGE_DEFINITIONS) {
    await db.insert(badges).values({
      id: nanoid(),
      ...badge,
    }).onConflictDoNothing();
  }

  console.log(`Seeded ${BADGE_DEFINITIONS.length} badges`);
}

seedBadges().catch(console.error);
