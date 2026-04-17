import type { APIRoute } from 'astro';
import { github } from '@lib/oauth';
import { generateState } from 'arctic';
import { createHmac } from 'crypto';

// Sign state dengan HMAC menggunakan secret dari env
// Ini menghindari ketergantungan pada cookie untuk CSRF protection
function getSecret(): string {
  const secret = import.meta.env.OAUTH_GITHUB_CLIENT_SECRET;
  if (!secret) {
    if (import.meta.env.PROD) throw new Error('OAUTH_GITHUB_CLIENT_SECRET is required in production');
    return 'dev-secret';
  }
  return secret;
}

function signState(state: string): string {
  const sig = createHmac('sha256', getSecret()).update(state).digest('hex').slice(0, 16);
  return `${state}.${sig}`;
}

export function verifySignedState(signedState: string): string | null {
  const lastDot = signedState.lastIndexOf('.');
  if (lastDot === -1) return null;
  const state = signedState.slice(0, lastDot);
  const sig = signedState.slice(lastDot + 1);
  const expected = createHmac('sha256', getSecret()).update(state).digest('hex').slice(0, 16);
  return sig === expected ? state : null;
}

export function extractReturnTo(state: string): string {
  const pipe = state.indexOf('|');
  if (pipe === -1) return '/app/overview';
  const returnTo = state.slice(pipe + 1);
  // Validasi: hanya allow path internal (tidak boleh redirect ke domain lain)
  return returnTo.startsWith('/') ? returnTo : '/app/overview';
}

export const GET: APIRoute = async ({ url }) => {
  const returnTo = url.searchParams.get('returnTo') || '/app/overview';
  // Encode returnTo ke dalam state: "randomstate|/path"
  const state = generateState() + '|' + returnTo;
  const signedState = signState(state);

  const authUrl = github.createAuthorizationURL(signedState, ['read:user', 'user:email']);

  return new Response(null, {
    status: 302,
    headers: { 'Location': authUrl.toString() },
  });
};
