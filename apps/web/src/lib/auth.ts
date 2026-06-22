import { Lucia } from 'lucia';
import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import { db } from '@smauii/db';
import { sessions, users } from '@smauii/db';

let isProd = false;
try { isProd = import.meta.env.NODE_ENV === 'production'; }
catch { isProd = process.env.NODE_ENV === 'production'; }

const adapter = new DrizzleSQLiteAdapter(db, sessions, users);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: isProd,
    },
  },
  getUserAttributes: (attributes) => {
    return {
      githubId: attributes.githubId,
      githubUsername: attributes.githubUsername,
      avatarUrl: attributes.avatarUrl,
      name: attributes.name,
      email: attributes.email,
      role: attributes.role,
      status: attributes.status,
      nis: attributes.nis,
      nisn: attributes.nisn,
      class: attributes.class,
      joinedAt: attributes.joinedAt,
      approvedBy: attributes.approvedBy,
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
  avatarUrl: string | null;
  name: string;
  email: string;
  role: string;
  status: string;
  nis: string;
  nisn: string | null;
  class: string;
  joinedAt: number;
  approvedBy: string | null;
}
