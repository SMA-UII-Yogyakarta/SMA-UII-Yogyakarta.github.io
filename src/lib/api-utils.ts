export type HttpStatus = 
  | 400 
  | 401 
  | 403 
  | 404 
  | 409 
  | 422 
  | 429 
  | 500;

export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, string>;
}

// XSS Sanitization - escape HTML special characters
export function escapeHtml(str: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return str.replace(/[&<>"'/]/g, (char) => htmlEntities[char] || char);
}

// Escape all string values in an object (for XSS prevention)
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = escapeHtml(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? escapeHtml(item) : item
      );
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized as T;
}

export function createErrorResponse(
  message: string,
  status: HttpStatus,
  options?: { code?: string; details?: Record<string, string> }
): Response {
  const body: ApiError = { 
    error: message,
    ...(options?.code && { code: options.code }),
    ...(options?.details && { details: options.details }),
  };
  
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): Response {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

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
