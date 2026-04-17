import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'zod';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentBase = join(__dirname, '..', 'smauii-dev-content', 'tracks');

const lessons = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: contentBase,
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    track: z.string().optional(),
    module: z.string().optional(),
    order: z.number().optional().default(0),
    level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    duration: z.number().optional(), // menit
    prerequisites: z.array(z.string()).optional().default([]),
    tags: z.array(z.string()).optional().default([]),
    author: z.string().optional(),
    updated: z.coerce.string().optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
  }),
});

export const collections = { lessons };
