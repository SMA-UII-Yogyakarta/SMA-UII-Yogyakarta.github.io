// Dormant utility for SSG/Hybrid deployment mode (web app → external API)
// Not currently imported — active auth uses Lucia httpOnly cookies.
// Activate by importing this file when deploying in SSG mode.

let useExternalAPI: boolean;
let apiBaseUrl: string;
try {
  const mode = import.meta.env.DEPLOY_MODE || 'ssr';
  useExternalAPI = mode === 'ssg' || mode === 'hybrid';
  apiBaseUrl = import.meta.env.PUBLIC_API_URL || '';
} catch {
  const mode = process.env.DEPLOY_MODE || 'ssr';
  useExternalAPI = mode === 'ssg' || mode === 'hybrid';
  apiBaseUrl = process.env.PUBLIC_API_URL || '';
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_token', token);
}

function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
}

export interface ApiResult<T> {
  data?: T;
  error?: string;
  code?: string;
  details?: Record<string, string>;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResult<T>> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token && useExternalAPI) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const url = `${apiBaseUrl}${path}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: useExternalAPI ? 'same-origin' : 'include',
    });

    if (res.status === 401) {
      clearToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return { error: 'Unauthorized', code: 'UNAUTHORIZED' };
    }

    const json = await res.json();

    if (!res.ok) {
      return {
        error: json.error || 'Request failed',
        code: json.code,
        ...(json.details && { details: json.details }),
      };
    }

    return { data: json.data ?? json };
  } catch (err) {
    return { error: 'Network error', code: 'NETWORK_ERROR' };
  }
}

export function getApiBaseUrl(): string {
  return apiBaseUrl;
}

export function isExternalApiMode(): boolean {
  return useExternalAPI;
}

export function apiUrl(path: string): string {
  return `${apiBaseUrl}${path}`;
}

export function authHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const token = getToken();
  if (token && useExternalAPI) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export { getToken, setToken, clearToken };
