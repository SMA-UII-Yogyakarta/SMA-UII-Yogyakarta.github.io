import { Lucia } from 'lucia';
import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import { db } from '@db';
import { sessions, users } from '@db/schema';

const adapter = new DrizzleSQLiteAdapter(db, sessions, users);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: import.meta.env.PROD,
    },
  },
  getUserAttributes: (attributes) => {
    return {
      githubId: attributes.githubId,
      githubUsername: attributes.githubUsername,
      name: attributes.name,
      email: attributes.email,
      role: attributes.role,
      status: attributes.status,
      nisn: attributes.nisn,
      class: attributes.class,
      joinedAt: attributes.joinedAt,
    };
  },
});

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

interface DatabaseUserAttributes {
  githubId: string | null;
  githubUsername: string | null;
  name: string;
  email: string;
  role: string;
  status: string;
  nisn: string;
  class: string;
  joinedAt: number;
}
