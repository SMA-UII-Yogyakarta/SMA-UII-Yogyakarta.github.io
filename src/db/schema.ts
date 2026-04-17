import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Users table - single source of truth
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  nisn: text('nisn').notNull().unique(),
  nis: text('nis').notNull().unique(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  githubUsername: text('github_username'),
  githubId: text('github_id'),
  passwordHash: text('password_hash'),
  class: text('class').notNull(),
  role: text('role').notNull().default('member'),
  status: text('status').notNull().default('pending'),
  joinedAt: integer('joined_at').notNull(), // Unix timestamp (ms)
  approvedAt: integer('approved_at'),       // Unix timestamp (ms)
  approvedBy: text('approved_by'),
}, (table) => [
  index('idx_users_nisn').on(table.nisn),
  index('idx_users_email').on(table.email),
  index('idx_users_status').on(table.status),
]);

// User relations
export const usersRelations = relations(users, ({ one, many }) => ({
  tracks: many(memberTracks),
  card: one(memberCards, {
    fields: [users.id],
    references: [memberCards.userId],
  }),
  sessions: many(sessions),
  activities: many(activities),
}));

// Member tracks - many-to-many relationship
export const memberTracks = sqliteTable('member_tracks', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  track: text('track').notNull(),
  joinedAt: integer('joined_at').notNull(), // Unix timestamp (ms)
}, (table) => [
  index('idx_member_tracks_user_id').on(table.userId),
  index('idx_member_tracks_track').on(table.track),
]);

// Member tracks relations
export const memberTracksRelations = relations(memberTracks, ({ one }) => ({
  user: one(users, {
    fields: [memberTracks.userId],
    references: [users.id],
  }),
}));

// Sessions for auth
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  expiresAt: integer('expires_at').notNull(), // Unix timestamp (ms)
}, (table) => [
  index('idx_sessions_user_id').on(table.userId),
]);

// Sessions relations
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

// Member cards - generated after approval
export const memberCards = sqliteTable('member_cards', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => users.id),
  cardNumber: text('card_number').notNull().unique(),
  qrCode: text('qr_code').notNull(),
  issuedAt: integer('issued_at').notNull(), // Unix timestamp (ms)
});

// Member cards relations
export const memberCardsRelations = relations(memberCards, ({ one }) => ({
  user: one(users, {
    fields: [memberCards.userId],
    references: [users.id],
  }),
}));

// Activity log for tracking contributions
export const activities = sqliteTable('activities', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  type: text('type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  url: text('url'),
  createdAt: integer('created_at').notNull(), // Unix timestamp (ms)
}, (table) => [
  index('idx_activities_user_id').on(table.userId),
  index('idx_activities_created_at').on(table.createdAt),
]);

// Activities relations
export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));

// Notifications for user alerts
export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  message: text('message').notNull(),
  isRead: integer('is_read').notNull().default(0),
  createdAt: integer('created_at').notNull(), // Unix timestamp (ms)
}, (table) => [
  index('idx_notifications_user_id').on(table.userId),
  index('idx_notifications_created_at').on(table.createdAt),
]);

// Notifications relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Announcements for admin posts
export const announcements = sqliteTable('announcements', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at').notNull(), // Unix timestamp (ms)
});

// Announcements relations
export const announcementsRelations = relations(announcements, ({ one }) => ({
  creator: one(users, {
    fields: [announcements.createdBy],
    references: [users.id],
  }),
}));

// Projects for member showcases
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  description: text('description'),
  url: text('url'),
  imageUrl: text('image_url'),
  createdAt: integer('created_at').notNull(), // Unix timestamp (ms)
}, (table) => [
  index('idx_projects_user_id').on(table.userId),
]);

// Projects relations
export const projectsRelations = relations(projects, ({ one }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
}));

// Learning progress — tandai selesai per lesson
export const learningProgress = sqliteTable('learning_progress', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  lessonSlug: text('lesson_slug').notNull(),
  completedAt: integer('completed_at').notNull(),
}, (table) => [
  index('idx_progress_user_id').on(table.userId),
  index('idx_progress_lesson').on(table.lessonSlug),
]);

// Reading sessions — waktu baca per lesson
export const readingSessions = sqliteTable('reading_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  lessonSlug: text('lesson_slug').notNull(),
  startedAt: integer('started_at').notNull(),  // Unix ms
  endedAt: integer('ended_at'),                // null = masih baca
  duration: integer('duration'),               // detik aktif
}, (table) => [
  index('idx_reading_user_id').on(table.userId),
  index('idx_reading_started').on(table.startedAt),
]);

export const learningProgressRelations = relations(learningProgress, ({ one }) => ({
  user: one(users, { fields: [learningProgress.userId], references: [users.id] }),
}));

export type LearningProgress = typeof learningProgress.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type MemberTrack = typeof memberTracks.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type MemberCard = typeof memberCards.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type Project = typeof projects.$inferSelect;
