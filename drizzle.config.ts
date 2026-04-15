import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.PUBLIC_TURSO_URL || 'file:local.db',
    authToken: process.env.PUBLIC_TURSO_TOKEN,
  },
} satisfies Config;
