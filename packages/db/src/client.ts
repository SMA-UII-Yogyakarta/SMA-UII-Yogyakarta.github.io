import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

let tursoUrl: string;
let tursoToken: string;
try {
  tursoUrl = import.meta.env.TURSO_URL || process.env.TURSO_URL || 'file:local.db';
  tursoToken = import.meta.env.TURSO_TOKEN || process.env.TURSO_TOKEN || '';
} catch {
  tursoUrl = process.env.TURSO_URL || 'file:local.db';
  tursoToken = process.env.TURSO_TOKEN || '';
}

export const client = createClient({
  url: tursoUrl,
  authToken: tursoToken,
});

export const db = drizzle(client, { schema });
