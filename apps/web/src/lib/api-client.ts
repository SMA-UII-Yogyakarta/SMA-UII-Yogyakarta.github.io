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

const CACHE_PREFIX = 'ac_';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function getCachedData<T>(key: string): { data: T } | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = sessionStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return { data: entry.data as T };
  } catch {
    return null;
  }
}

function setCachedData(key: string, data: unknown): void {
  try {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch { /* sessionStorage quota exceeded */ }
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
  const isRead = !options.method || options.method === 'GET';

  // Return cached data synchronously for GET requests
  if (isRead && typeof window !== 'undefined') {
    const cached = getCachedData<T>(path);
    if (cached) return { data: cached.data };
  }

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

    const resultData = json.data ?? json;
    if (isRead) {
      setCachedData(path, resultData);
    }
    return { data: resultData };
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
