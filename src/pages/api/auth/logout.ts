import type { APIRoute } from 'astro';
import { lucia } from '@lib/auth';
import { createErrorResponse, createSuccessResponse } from '@lib/api-utils';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  const sessionId = cookies.get(lucia.sessionCookieName)?.value ?? null;
  
  if (sessionId) {
    await lucia.invalidateSession(sessionId);
  }

  const sessionCookie = lucia.createBlankSessionCookie();
  cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

  return redirect('/');
};
