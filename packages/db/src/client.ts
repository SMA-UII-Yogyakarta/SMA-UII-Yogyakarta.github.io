import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// Server-side only — tidak boleh pakai prefix PUBLIC_
// Astro membaca .env.production saat build production,
// sehingga import.meta.env sudah berisi nilai yang benar.
// process.env sebagai safety net untuk environment non-Astro (test, scripts).
const tursoUrl   = import.meta.env.TURSO_URL   || process.env.TURSO_URL   || 'file:local.db';
const tursoToken = import.meta.env.TURSO_TOKEN || process.env.TURSO_TOKEN || '';

export const client = createClient({
  url: tursoUrl,
  authToken: tursoToken,
});

export const db = drizzle(client, { schema });
