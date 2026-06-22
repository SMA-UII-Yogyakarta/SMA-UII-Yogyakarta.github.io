import type { MiddlewareHandler } from 'astro';
import { lucia } from '@lib/auth';
import { db, users } from '@smauii/db';
import { eq } from 'drizzle-orm';
import { ErrorCode } from '@smauii/shared';
import { setSecurityHeaders } from '@lib/security';

// In-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count++;
  return entry.count <= maxRequests;
}

// Bersihkan entry expired setiap 5 menit
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}, 300_000);

const SENSITIVE_ROUTES = new Map([
  ['/api/auth/login', { max: 5, window: 60_000 }],
  ['/api/auth/register', { max: 3, window: 60_000 }],
  ['/api/register', { max: 3, window: 60_000 }],
  ['/api/auth/forgot-password', { max: 3, window: 60_000 }],
  ['/api/auth/reset-password', { max: 5, window: 60_000 }],
  ['/api/slims/verify', { max: 10, window: 60_000 }],
]);

export const onRequest: MiddlewareHandler = async (context, next) => {
  // Rate limiting untuk endpoint sensitif
  const routeConfig = SENSITIVE_ROUTES.get(context.url.pathname);
  if (routeConfig) {
    const ip = context.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || context.request.headers.get('x-real-ip')
      || 'unknown';
    if (!rateLimit(ip, routeConfig.max, routeConfig.window)) {
      return new Response(JSON.stringify({ error: 'Too many requests', code: ErrorCode.RATE_LIMITED }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Validate session once per request and store in locals
  const sessionId = context.cookies.get(lucia.sessionCookieName)?.value ?? null;
  if (sessionId) {
    const { session, user } = await lucia.validateSession(sessionId);
    if (session) {
      if (session.fresh) {
        const sessionCookie = lucia.createSessionCookie(session.id);
        context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
      }
      // Load additional user fields from database
      const dbUser = await db.query.users.findFirst({
        columns: { avatarUrl: true, approvedBy: true },
        where: eq(users.id, user.id),
      });
      context.locals.session = session;
      context.locals.user = {
        ...user,
        avatarUrl: dbUser?.avatarUrl ?? null,
        approvedBy: dbUser?.approvedBy ?? null,
      };
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

  setSecurityHeaders(response);

  return response;
};
