import type { MiddlewareHandler } from 'astro';
import { lucia } from './lib/auth';

export const onRequest: MiddlewareHandler = async (context, next) => {
  // Validate session once per request and store in locals
  const sessionId = context.cookies.get(lucia.sessionCookieName)?.value ?? null;
  if (sessionId) {
    const { session, user } = await lucia.validateSession(sessionId);
    if (session) {
      if (session.fresh) {
        const sessionCookie = lucia.createSessionCookie(session.id);
        context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
      }
      context.locals.session = session;
      context.locals.user = user;
    } else {
      const blankCookie = lucia.createBlankSessionCookie();
      context.cookies.set(blankCookie.name, blankCookie.value, blankCookie.attributes);
      context.locals.session = null;
      context.locals.user = null;
    }
  } else {
    context.locals.session = null;
    context.locals.user = null;
  }

  const response = await next();

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  const connectSrc = import.meta.env.PROD
    ? "'self' https://github.com https://api.github.com https://github.githubassets.com https://avatars.githubusercontent.com"
    : "'self' https://github.com https://api.github.com https://github.githubassets.com https://avatars.githubusercontent.com https://astro.build";
  response.headers.set(
    'Content-Security-Policy',
    `default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https:; connect-src ${connectSrc}; font-src 'self' https://cdn.jsdelivr.net`
  );

  return response;
};
