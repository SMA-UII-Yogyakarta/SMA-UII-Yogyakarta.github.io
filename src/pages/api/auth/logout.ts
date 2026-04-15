import type { APIRoute } from 'astro';
import { lucia } from '@lib/auth';

export const POST: APIRoute = async ({ locals, cookies, redirect }) => {
  const { session } = locals;
  if (session) await lucia.invalidateSession(session.id);

  const blankCookie = lucia.createBlankSessionCookie();
  cookies.set(blankCookie.name, blankCookie.value, blankCookie.attributes);

  return redirect('/login');
};
