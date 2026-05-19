import { z } from 'zod';

// ── Registration schemas ─────────────────────────────────────────────────────

// Web registration (no password — set later by admin)
export const registerSchema = z.object({
  nis: z.string().min(1, 'NIS harus diisi').max(20, 'NIS maksimal 20 karakter'),
  name: z.string().min(1, 'Nama harus diisi').max(100, 'Nama maksimal 100 karakter'),
  email: z.string().min(1, 'Email harus diisi').email('Email tidak valid'),
  class: z.string().min(1, 'Kelas harus diisi'),
  githubUsername: z.string().optional(),
  tracks: z.array(z.enum(['robotika', 'ai', 'data-science', 'network', 'security', 'software']))
    .min(1, 'Pilih minimal 1 track')
    .max(3, 'Maksimal 3 track'),
});

// API registration (includes password)
export const apiRegisterSchema = registerSchema.extend({
  password: z.string().min(8, 'Password minimal 8 karakter'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type ApiRegisterInput = z.infer<typeof apiRegisterSchema>;

// ── Login schema ──────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  identifier: z.string().min(1, 'NIS atau email harus diisi'),
  password: z.string().min(1, 'Password harus diisi'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ── Track options ─────────────────────────────────────────────────────────────

export const trackOptions = [
  { value: 'robotika', label: '🤖 Robotika/IoT' },
  { value: 'ai', label: '🧠 AI (Kecerdasan Buatan)' },
  { value: 'data-science', label: '📊 Data Science' },
  { value: 'network', label: '🌐 Jaringan Komputer' },
  { value: 'security', label: '🔐 Keamanan Siber' },
  { value: 'software', label: '💻 Software Engineering' },
];

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
  name: z.string().min(1, 'Nama tidak boleh kosong').max(100, 'Nama maksimal 100 karakter').optional(),
  githubUsername: z.string().optional(),
  avatarUrl: z.string().url('URL avatar tidak valid').optional().or(z.literal('')),
});

export const readingSessionSchema = z.object({
  slug: z.string().min(1, 'Slug harus diisi'),
  action: z.enum(['start', 'end'], { message: 'Action tidak valid' }),
  duration: z.number().optional(),
});

export const classOptions = [
  'X IPA 1', 'X IPA 2', 'X IPA 3', 'X IPA 4',
  'X IPS 1', 'X IPS 2', 'X IPS 3',
  'XI IPA 1', 'XI IPA 2', 'XI IPA 3', 'XI IPA 4',
  'XI IPS 1', 'XI IPS 2', 'XI IPS 3',
  'XII IPA 1', 'XII IPA 2', 'XII IPA 3', 'XII IPA 4',
  'XII IPS 1', 'XII IPS 2', 'XII IPS 3',
];
