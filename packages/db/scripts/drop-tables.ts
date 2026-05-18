import { createClient } from '@libsql/client';

const tursoUrl = process.env.TURSO_URL || 'file:local.db';
const tursoToken = process.env.TURSO_TOKEN || '';

const client = createClient({
  url: tursoUrl,
  authToken: tursoToken,
});

async function dropAll() {
  console.log('🗑️  Dropping all tables...');
  
  try {
    // Disable FK checks, drop in dependency order (children first)
    await client.execute('PRAGMA foreign_keys = OFF');
    await client.execute('DROP TABLE IF EXISTS notifications');
    await client.execute('DROP TABLE IF EXISTS activities');
    await client.execute('DROP TABLE IF EXISTS projects');
    await client.execute('DROP TABLE IF EXISTS announcements');
    await client.execute('DROP TABLE IF EXISTS member_cards');
    await client.execute('DROP TABLE IF EXISTS member_tracks');
    await client.execute('DROP TABLE IF EXISTS sessions');
    await client.execute('DROP TABLE IF EXISTS users');
    await client.execute('PRAGMA foreign_keys = ON');
    console.log('✅ All tables dropped');
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

dropAll();