import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

const tursoUrl = process.env.PUBLIC_TURSO_URL || 'file:local.db';
const tursoToken = process.env.PUBLIC_TURSO_TOKEN || '';

const client = createClient({
  url: tursoUrl,
  authToken: tursoToken,
});

const db = drizzle(client);

async function dropAll() {
  console.log('🗑️  Dropping all tables...');
  
  try {
    await client.execute('DROP TABLE IF EXISTS activities');
    await client.execute('DROP TABLE IF EXISTS member_cards');
    await client.execute('DROP TABLE IF EXISTS member_tracks');
    await client.execute('DROP TABLE IF EXISTS sessions');
    await client.execute('DROP TABLE IF EXISTS users');
    console.log('✅ All tables dropped');
  } catch (e) {
    console.error('Error:', e);
  }
}

dropAll();