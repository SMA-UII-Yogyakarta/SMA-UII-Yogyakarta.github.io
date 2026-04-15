import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// Client-side Turso connection
// Note: Untuk production, gunakan env variables yang di-expose ke client
const tursoUrl = import.meta.env.TURSO_URL || 'file:local.db';
const tursoToken = import.meta.env.TURSO_TOKEN || '';

export const client = createClient({
  url: tursoUrl,
  authToken: tursoToken,
});

export const db = drizzle(client, { schema });
