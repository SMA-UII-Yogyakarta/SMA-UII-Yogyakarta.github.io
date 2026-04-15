import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// Server-side only — TURSO_URL dan TURSO_TOKEN adalah secret server,
// tidak boleh pakai prefix PUBLIC_ dan tidak boleh di-expose ke browser.
// Use process.env for compatibility with test environment
const tursoUrl = (typeof import.meta !== 'undefined' && import.meta.env?.TURSO_URL) 
  || process.env.TURSO_URL 
  || 'file:local.db';
const tursoToken = (typeof import.meta !== 'undefined' && import.meta.env?.TURSO_TOKEN) 
  || process.env.TURSO_TOKEN 
  || '';

export const client = createClient({
  url: tursoUrl,
  authToken: tursoToken,
});

export const db = drizzle(client, { schema });
