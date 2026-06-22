let isProd = false;
try { isProd = import.meta.env.NODE_ENV === 'production'; }
catch { isProd = process.env.NODE_ENV === 'production'; }

const CSP_CONNECT_SRC = isProd
  ? "'self' https://github.com https://api.github.com https://github.githubassets.com https://avatars.githubusercontent.com"
  : "'self' https://github.com https://api.github.com https://github.githubassets.com https://avatars.githubusercontent.com https://astro.build";

const CSP_STATIC = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "img-src 'self' data: https:",
  `connect-src ${CSP_CONNECT_SRC}`,
  "font-src 'self' https://cdn.jsdelivr.net",
].join('; ');

export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': CSP_STATIC,
} as const;

export function setSecurityHeaders(response: Response): void {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
}

export function getCspString(): string {
  return CSP_STATIC;
}
