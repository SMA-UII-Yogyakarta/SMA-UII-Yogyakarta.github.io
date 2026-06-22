import { GitHub } from 'arctic';

const clientId = import.meta.env.OAUTH_GITHUB_CLIENT_ID || '';
const clientSecret = import.meta.env.OAUTH_GITHUB_CLIENT_SECRET || '';
const siteUrl = import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321';

export const github = new GitHub(
  clientId,
  clientSecret,
  `${siteUrl}/api/auth/github/callback`
);
