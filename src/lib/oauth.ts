import { GitHub } from 'arctic';

const env = import.meta.env;

export const github = new GitHub(
  env.OAUTH_GITHUB_CLIENT_ID || '',
  env.OAUTH_GITHUB_CLIENT_SECRET || '',
  `${env.PUBLIC_SITE_URL || 'http://localhost:4321'}/api/auth/github/callback`
);
