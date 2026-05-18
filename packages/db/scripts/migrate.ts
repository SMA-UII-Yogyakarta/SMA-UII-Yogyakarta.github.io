import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { migrate } from 'drizzle-orm/libsql/migrator';

// Load env
const env = process.env;
const tursoUrl = env.TURSO_URL || 'file:local.db';
const tursoToken = env.TURSO_TOKEN || '';

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
