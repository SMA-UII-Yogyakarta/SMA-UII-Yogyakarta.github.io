import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { migrate } from 'drizzle-orm/libsql/migrator';

// Load env
const env = typeof process !== 'undefined' ? process.env : (Bun?.env || {});
const tursoUrl = env.PUBLIC_TURSO_URL || 'file:local.db';
const tursoToken = env.PUBLIC_TURSO_TOKEN || '';

const client = createClient({
  url: tursoUrl,
  authToken: tursoToken,
});

const db = drizzle(client);

async function runMigrations() {
  console.log('🔄 Running migrations...\n');
  
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('✅ Migrations completed successfully!\n');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    if (typeof process !== 'undefined') {
      process.exit(1);
    }
  } finally {
    client.close();
  }
}

runMigrations();
