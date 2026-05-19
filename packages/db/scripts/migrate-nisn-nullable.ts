/**
 * Migration: Make nisn nullable
 *
 * This script:
 * 1. Makes nisn column nullable (was required before)
 * 2. Sets all existing nisn values to NULL (they contain NIS, not real NISN)
 * 3. Adds index on nis column if not exists
 *
 * Run with: bun run db:migrate-nisn
 */

import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import { sql } from 'drizzle-orm';

const sqlite = new Database('local.db');
const db = drizzle(sqlite);

async function migrate() {
  console.log('Starting migration: nisn nullable...');

  try {
    // Step 1: Drop NOT NULL constraint on nisn (SQLite requires table rebuild)
    console.log('Step 1: Recreating table with nullable nisn...');

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS users_new (
        id TEXT PRIMARY KEY,
        nis TEXT NOT NULL UNIQUE,
        nisn TEXT UNIQUE,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        github_username TEXT,
        avatar_url TEXT,
        github_id TEXT,
        password_hash TEXT,
        class TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        status TEXT NOT NULL DEFAULT 'pending',
        joined_at INTEGER NOT NULL,
        approved_at INTEGER,
        approved_by TEXT
      )
    `);

    // Step 2: Copy data (nisn will be NULL)
    console.log('Step 2: Copying data (nisn set to NULL)...');

    await db.run(sql`
      INSERT INTO users_new (
        id, nis, nisn, name, email, github_username, avatar_url, github_id,
        password_hash, class, role, status, joined_at, approved_at, approved_by
      )
      SELECT 
        id, nis, NULL, name, email, github_username, avatar_url, github_id,
        password_hash, class, role, status, joined_at, approved_at, approved_by
      FROM users
    `);

    // Step 3: Drop old table and rename
    console.log('Step 3: Swapping tables...');

    await db.run(sql`DROP TABLE users`);
    await db.run(sql`ALTER TABLE users_new RENAME TO users`);

    // Step 4: Create indexes
    console.log('Step 4: Creating indexes...');

    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_users_nis ON users(nis)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_users_nisn ON users(nisn)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)`);

    console.log('Migration completed successfully!');
    console.log('Summary:');
    console.log('  - nisn is now nullable');
    console.log('  - All existing nisn values set to NULL');
    console.log('  - nis is the primary identifier');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }

  sqlite.close();
}

migrate();
