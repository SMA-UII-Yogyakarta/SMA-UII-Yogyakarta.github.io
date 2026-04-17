import type { APIRoute } from 'astro';
import { lucia } from '@lib/auth';

export const POST: APIRoute = async ({ locals, cookies }) => {
  const { session } = locals;
  if (session) await lucia.invalidateSession(session.id);

  const blankCookie = lucia.createBlankSessionCookie();
  cookies.set(blankCookie.name, blankCookie.value, blankCookie.attributes);

  // 303 See Other — POST/Redirect/GET pattern
  // Mencegah browser re-submit POST saat back/refresh
  return new Response(null, {
    status: 303,
    headers: { Location: '/login' },
  });
};

// Tolak GET request — logout harus selalu POST
export const GET: APIRoute = () =>
  new Response(null, { status: 405, headers: { Allow: 'POST' } });
