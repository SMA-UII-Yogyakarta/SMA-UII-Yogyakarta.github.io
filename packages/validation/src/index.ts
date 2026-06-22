import { z } from 'zod';
import { getTrackValues, getTrackOptions, getClassOptions, type TrackDef } from '@smauii/shared';

const _trackValues = getTrackValues() as [string, ...string[]];
const _trackEnum = z.enum(_trackValues);

export type TrackValue = (typeof _trackValues)[number];

export const registerSchema = z.object({
  nis: z.string().min(1, 'NIS harus diisi').max(20, 'NIS maksimal 20 karakter'),
  nisn: z.string().min(1, 'NISN harus diisi').max(20, 'NISN maksimal 20 karakter').optional(),
  name: z.string().min(1, 'Nama harus diisi').max(100, 'Nama maksimal 100 karakter'),
  email: z.string().min(1, 'Email harus diisi').email('Email tidak valid'),
  class: z.string().min(1, 'Kelas harus diisi'),
  githubUsername: z.string().optional(),
  tracks: z.array(_trackEnum).min(1, 'Pilih minimal 1 track').max(3, 'Maksimal 3 track'),
});

export const apiRegisterSchema = registerSchema.extend({
  password: z.string().min(8, 'Password minimal 8 karakter'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type ApiRegisterInput = z.infer<typeof apiRegisterSchema>;

export const loginSchema = z.object({
  identifier: z.string().min(1, 'NIS atau email harus diisi'),
  password: z.string().min(1, 'Password harus diisi'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const trackOptions: TrackDef[] = getTrackOptions();

export const activityTypeOptions = [
  'contribution', 'event', 'workshop', 'meeting', 'other',
] as const;

export const createActivitySchema = z.object({
  type: z.enum(activityTypeOptions, { message: 'Tipe tidak valid' }),
  title: z.string().min(1, 'Judul harus diisi').max(200, 'Judul maksimal 200 karakter'),
  description: z.string().optional(),
  url: z.string().optional(),
});

export const approveUserSchema = z.object({
  userId: z.string().min(1, 'User ID harus diisi'),
  action: z.enum(['approve', 'reject'], { message: 'Action tidak valid' }),
});

export const setPasswordSchema = z.object({
  userId: z.string().min(1, 'User ID harus diisi'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Nama tidak boleh kosong').max(100, 'Nama maksimal 100 karakter').transform(s => s.trim()).optional(),
  githubUsername: z.string().optional(),
  avatarUrl: z.string().url('URL avatar tidak valid').optional().or(z.literal('')),
});

export const readingSessionSchema = z.object({
  slug: z.string().min(1, 'Slug harus diisi'),
  action: z.enum(['start', 'end'], { message: 'Action tidak valid' }),
  duration: z.number().optional(),
});

export const classOptions = getClassOptions();

export const userRoleOptions = ['member', 'maintainer', 'alumni'] as const;
export const userStatusOptions = ['pending', 'active', 'inactive'] as const;

export const updateUserSchema = z.object({
  userId: z.string().min(1, 'User ID harus diisi'),
  role: z.enum(userRoleOptions, { message: 'Role tidak valid' }).optional(),
  status: z.enum(userStatusOptions, { message: 'Status tidak valid' }).optional(),
  name: z.string().min(1, 'Nama tidak boleh kosong').max(100, 'Nama maksimal 100 karakter').transform(s => s.trim()).optional(),
  email: z.string().email('Email tidak valid').optional(),
  class: z.string().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const createProjectSchema = z.object({
  title: z.string().min(1, 'Judul harus diisi').max(200, 'Judul maksimal 200 karakter').transform(s => s.trim()),
  description: z.string().max(2000, 'Deskripsi maksimal 2000 karakter').transform(s => s?.trim() || undefined).optional(),
  url: z.string().url('URL tidak valid').optional().or(z.literal('')),
  imageUrl: z.string().url('URL gambar tidak valid').optional().or(z.literal('')),
});

export const updateProjectSchema = z.object({
  title: z.string().min(1, 'Judul tidak boleh kosong').max(200, 'Judul maksimal 200 karakter').transform(s => s.trim()).optional(),
  description: z.string().max(2000, 'Deskripsi maksimal 2000 karakter').transform(s => s?.trim() || undefined).optional(),
  url: z.string().url('URL tidak valid').optional().or(z.literal('')),
  imageUrl: z.string().url('URL gambar tidak valid').optional().or(z.literal('')),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Judul harus diisi').max(200, 'Judul maksimal 200 karakter').transform(s => s.trim()),
  content: z.string().min(1, 'Konten harus diisi').max(10000, 'Konten maksimal 10000 karakter').transform(s => s.trim()),
});

export const updateAnnouncementSchema = z.object({
  title: z.string().min(1, 'Judul tidak boleh kosong').max(200, 'Judul maksimal 200 karakter').transform(s => s.trim()).optional(),
  content: z.string().min(1, 'Konten tidak boleh kosong').max(10000, 'Konten maksimal 10000 karakter').transform(s => s.trim()).optional(),
  isPinned: z.boolean().optional(),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email harus diisi').email('Email tidak valid'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token harus diisi'),
  password: z.string().min(8, 'Password minimal 8 karakter').max(100, 'Password maksimal 100 karakter'),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// Alias for clarity in login route — identical schema, explicit naming
export const loginSchemaWithNis = loginSchema;
export type LoginSchemaWithNisInput = LoginInput;

export const learningProgressSchema = z.object({
  slug: z.string().min(1, 'Slug harus diisi'),
  completed: z.boolean().optional(),
});

export type LearningProgressInput = z.infer<typeof learningProgressSchema>;

export const markNotificationReadSchema = z.object({
  id: z.string().min(1, 'Notification ID harus diisi'),
});

export type MarkNotificationReadInput = z.infer<typeof markNotificationReadSchema>;

export const deleteUserSchema = z.object({
  userId: z.string().min(1, 'User ID harus diisi'),
});

export type DeleteUserInput = z.infer<typeof deleteUserSchema>;
