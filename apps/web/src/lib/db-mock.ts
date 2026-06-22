// Mock database client for SSG compilation mode.
// Prevents Astro/Vite from bundling native libsql binaries.

const handler = {
  get() {
    return () => {
      throw new Error('Database queried at build-time in SSG mode.');
    };
  }
};

export const db = new Proxy({}, handler) as any;

// Table schemas
export const users = {} as any;
export const memberTracks = {} as any;
export const activities = {} as any;
export const announcements = {} as any;
export const memberCards = {} as any;
export const badges = {} as any;
export const userBadges = {} as any;
export const sessions = {} as any;
export const learnProgress = {} as any;
export const learnReading = {} as any;
export const notifications = {} as any;
export const learningProgress = {} as any;
export const projects = {} as any;
export const readingSessions = {} as any;

// Relations
export const usersRelations = {} as any;
export const memberTracksRelations = {} as any;
export const sessionsRelations = {} as any;
export const memberCardsRelations = {} as any;
export const activitiesRelations = {} as any;
export const notificationsRelations = {} as any;
export const announcementsRelations = {} as any;
export const projectsRelations = {} as any;
export const learningProgressRelations = {} as any;
export const readingSessionsRelations = {} as any;
export const badgesRelations = {} as any;
export const userBadgesRelations = {} as any;

// Helpers
export const checkAndAwardBadges = () => {
  return Promise.resolve([]);
};
export const getLeaderboard = () => {
  return Promise.resolve([]);
};
