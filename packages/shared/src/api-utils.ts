export type HttpStatus =
  | 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500;

// ---------------------------------------------------------------------------
// Typed error codes — single source of truth, no inline strings
// ---------------------------------------------------------------------------

export const ErrorCode = {
  // Auth
  INVALID_STATE: 'INVALID_STATE',
  INVALID_CODE: 'INVALID_CODE',
  OAUTH_ERROR: 'OAUTH_ERROR',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  NO_PASSWORD_SET: 'NO_PASSWORD_SET',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  // Registration
  USER_EXISTS: 'USER_EXISTS',
  MEMBER_NOT_FOUND: 'MEMBER_NOT_FOUND',
  // Rate limit
  RATE_LIMITED: 'RATE_LIMITED',
  // Password reset
  INVALID_TOKEN: 'INVALID_TOKEN',
  // Upload
  MISSING_FILE: 'MISSING_FILE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  // Generic
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface ApiError {
  error: string;
  code?: ErrorCodeType;
  details?: Record<string, string>;
}

export interface ApiSuccess<T> {
  data: T;
}

// ---------------------------------------------------------------------------
// Response builders
// ---------------------------------------------------------------------------

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
} as const;

export function createErrorResponse(
  message: string,
  status: HttpStatus,
  options?: { code?: ErrorCodeType; details?: Record<string, string> }
): Response {
  const body: ApiError = {
    error: message,
    ...(options?.code && { code: options.code }),
    ...(options?.details && { details: options.details }),
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}

export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): Response {
  return new Response(JSON.stringify({ data } as ApiSuccess<T>), {
    status,
    headers: JSON_HEADERS,
  });
}

// ---------------------------------------------------------------------------
// Middleware helpers
// ---------------------------------------------------------------------------

export interface UserSession {
  id: string;
  githubId?: string | null;
  githubUsername?: string | null;
  avatarUrl?: string | null;
  name: string;
  email: string;
  role: 'member' | 'maintainer' | 'alumni';
  status: 'pending' | 'active' | 'inactive';
}

/** Check if user has a given role — returns 403 response if not */
export function requireRole(
  user: UserSession | null,
  ...roles: string[]
): Response | null {
  if (!user) return createErrorResponse('Unauthorized', 401, { code: ErrorCode.UNAUTHORIZED });
  if (!roles.includes(user.role)) {
    return createErrorResponse('Forbidden', 403, { code: ErrorCode.FORBIDDEN });
  }
  return null;
}

/** Check if user is authenticated — returns 401 response if not */
export function requireAuth(user: UserSession | null): Response | null {
  if (!user) return createErrorResponse('Unauthorized', 401, { code: ErrorCode.UNAUTHORIZED });
  return null;
}

// ---------------------------------------------------------------------------
// Request helpers
// ---------------------------------------------------------------------------

export function parseJsonBody<T>(request: Request): Promise<T> {
  return request.json() as Promise<T>;
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

// ---------------------------------------------------------------------------
// API handler wrapper — auto auth, try/catch, standard format
// ---------------------------------------------------------------------------

type ApiHandler<T = Response> = (ctx: {
  request: Request;
  locals: Record<string, unknown>;
  user: UserSession | null;
}) => T | Promise<T>;

interface ApiHandlerOptions {
  auth?: boolean;
  role?: string[];
}

export function apiHandler(
  handler: ApiHandler,
  options?: ApiHandlerOptions
): (ctx: { request: Request; locals: Record<string, unknown> }) => Promise<Response> {
  return async (ctx) => {
    try {
      const user = (ctx.locals?.user as UserSession | null) ?? null;

      if (options?.auth) {
        const guard = requireAuth(user);
        if (guard) return guard;
      }

      if (options?.role?.length) {
        const guard = requireRole(user, ...options.role);
        if (guard) return guard;
      }

      return await handler({ ...ctx, user });
    } catch (err) {
      console.error('[apiHandler]', err);
      return createErrorResponse('Internal server error', 500, { code: ErrorCode.INTERNAL_ERROR });
    }
  };
}
