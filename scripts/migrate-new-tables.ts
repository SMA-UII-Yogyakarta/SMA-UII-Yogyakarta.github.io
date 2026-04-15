import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.PUBLIC_TURSO_URL || 'file:local.db',
  authToken: process.env.PUBLIC_TURSO_TOKEN,
});

const statements = [
  `CREATE TABLE IF NOT EXISTS notifications (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL,
    message text NOT NULL,
    is_read integer DEFAULT 0 NOT NULL,
    created_at integer NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)`,
  `CREATE TABLE IF NOT EXISTS announcements (
    id text PRIMARY KEY NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    created_by text NOT NULL,
    created_at integer NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS projects (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL,
    title text NOT NULL,
    description text,
    url text,
    image_url text,
    created_at integer NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id)`,
];

console.log('Running migration...');

for (const sql of statements) {
  try {
    await client.execute(sql);
    console.log('Executed:', sql.substring(0, 50) + '...');
  } catch (error: any) {
    if (error.code === 'SQLITE_TABLE_ALREADY_EXISTS' || error.message?.includes('already exists')) {
      console.log('Table already exists, skipping...');
    } else {
      console.error('Error:', error.message);
    }
  }
}

console.log('Migration completed!');
await client.close();