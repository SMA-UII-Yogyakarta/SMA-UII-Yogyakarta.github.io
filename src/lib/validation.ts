import { z } from 'zod';

export const registerSchema = z.object({
  nisn: z.string().min(1, 'NISN harus diisi').max(10, 'NISN maksimal 10 digit'),
  nis: z.string().min(1, 'NIS harus diisi').max(20, 'NIS maksimal 20 karakter'),
  name: z.string().min(1, 'Nama harus diisi').max(100, 'Nama maksimal 100 karakter'),
  email: z.string().min(1, 'Email harus diisi').check(z.email('Email tidak valid')),
  class: z.string().min(1, 'Kelas harus diisi'),
  githubUsername: z.string().optional(),
  tracks: z.array(z.enum(['robotika', 'ai', 'data-science', 'network', 'security', 'software']))
    .min(1, 'Pilih minimal 1 track')
    .max(3, 'Maksimal 3 track'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const trackOptions = [
  { value: 'robotika', label: '🤖 Robotika/IoT' },
  { value: 'ai', label: '🧠 AI (Kecerdasan Buatan)' },
  { value: 'data-science', label: '📊 Data Science' },
  { value: 'network', label: '🌐 Jaringan Komputer' },
  { value: 'security', label: '🔐 Keamanan Siber' },
  { value: 'software', label: '💻 Software Engineering' },
];

export const classOptions = [
  'X IPA 1', 'X IPA 2', 'X IPA 3', 'X IPA 4',
  'X IPS 1', 'X IPS 2', 'X IPS 3',
  'XI IPA 1', 'XI IPA 2', 'XI IPA 3', 'XI IPA 4',
  'XI IPS 1', 'XI IPS 2', 'XI IPS 3',
  'XII IPA 1', 'XII IPA 2', 'XII IPA 3', 'XII IPA 4',
  'XII IPS 1', 'XII IPS 2', 'XII IPS 3',
];
