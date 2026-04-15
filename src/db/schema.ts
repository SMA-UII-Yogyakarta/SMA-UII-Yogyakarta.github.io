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
  joinedAt: integer('joined_at').notNull(), // Store as Unix timestamp (ms)
  approvedAt: integer('approved_at'), // Store as Unix timestamp (ms)
  approvedBy: text('approved_by'),
}, (table) => ({
  nisnIdx: index('idx_users_nisn').on(table.nisn),
  emailIdx: index('idx_users_email').on(table.email),
  statusIdx: index('idx_users_status').on(table.status),
}));

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
  joinedAt: integer('joined_at').notNull(), // Store as Unix timestamp (ms)
}, (table) => ({
  userIdIdx: index('idx_member_tracks_user_id').on(table.userId),
  trackIdx: index('idx_member_tracks_track').on(table.track),
}));

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
  expiresAt: integer('expires_at').notNull(), // Store as Unix timestamp (ms)
}, (table) => ({
  userIdIdx: index('idx_sessions_user_id').on(table.userId),
}));

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
  issuedAt: integer('issued_at').notNull(), // Store as Unix timestamp (ms)
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
  createdAt: integer('created_at').notNull(), // Store as Unix timestamp (ms)
}, (table) => ({
  userIdIdx: index('idx_activities_user_id').on(table.userId),
  createdAtIdx: index('idx_activities_created_at').on(table.createdAt),
}));

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
  createdAt: integer('created_at').notNull(),
}, (table) => ({
  userIdIdx: index('idx_notifications_user_id').on(table.userId),
  createdAtIdx: index('idx_notifications_created_at').on(table.createdAt),
}));

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
  createdAt: integer('created_at').notNull(),
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
  createdAt: integer('created_at').notNull(),
}, (table) => ({
  userIdIdx: index('idx_projects_user_id').on(table.userId),
}));

// Projects relations
export const projectsRelations = relations(projects, ({ one }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type MemberTrack = typeof memberTracks.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type MemberCard = typeof memberCards.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type Project = typeof projects.$inferSelect;
