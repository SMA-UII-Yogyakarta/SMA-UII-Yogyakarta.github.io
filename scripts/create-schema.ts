import { createClient } from '@libsql/client';

const tursoUrl = process.env.PUBLIC_TURSO_URL || 'file:local.db';
const tursoToken = process.env.PUBLIC_TURSO_TOKEN || '';

const client = createClient({
  url: tursoUrl,
  authToken: tursoToken,
});

async function createSchema() {
  console.log('🔧 Creating schema...');
  
  try {
    // Users table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        nisn TEXT NOT NULL UNIQUE,
        nis TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        github_username TEXT,
        github_id TEXT,
        password_hash TEXT,
        class TEXT NOT NULL,
        role TEXT DEFAULT 'member' NOT NULL,
        status TEXT DEFAULT 'pending' NOT NULL,
        joined_at INTEGER NOT NULL,
        approved_at INTEGER,
        approved_by TEXT
      )
    `);
    console.log('✅ users table created');

    // Sessions table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE NO ACTION ON DELETE NO ACTION
      )
    `);
    console.log('✅ sessions table created');

    // Member tracks table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS member_tracks (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        track TEXT NOT NULL,
        joined_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE NO ACTION ON DELETE NO ACTION
      )
    `);
    console.log('✅ member_tracks table created');

    // Member cards table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS member_cards (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL UNIQUE,
        card_number TEXT NOT NULL UNIQUE,
        qr_code TEXT NOT NULL,
        issued_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE NO ACTION ON DELETE NO ACTION
      )
    `);
    console.log('✅ member_cards table created');

    // Activities table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        url TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE NO ACTION ON DELETE NO ACTION
      )
    `);
    console.log('✅ activities table created');

    console.log('\n✅ All tables created successfully!');
  } catch (e) {
    console.error('Error:', e);
  }
}

createSchema();