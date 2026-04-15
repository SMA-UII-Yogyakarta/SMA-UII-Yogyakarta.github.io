import type { APIRoute } from 'astro';
import { github } from '@lib/oauth';
import { generateState } from 'arctic';

export const GET: APIRoute = async ({ cookies, redirect }) => {
  const state = generateState();
  const url = github.createAuthorizationURL(state, ['read:user', 'user:email']);

  cookies.set('github_oauth_state', state, {
    path: '/',
    secure: import.meta.env.PROD,
    httpOnly: true,
    maxAge: 60 * 10, // 10 minutes
    sameSite: 'lax',
  });

  return redirect(url.toString());
};
