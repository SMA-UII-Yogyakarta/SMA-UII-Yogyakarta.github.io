const DEPLOY_MODE = import.meta.env.DEPLOY_MODE || 'ssr';
const API_BASE_URL = import.meta.env.PUBLIC_API_URL || '';

const isSSG = DEPLOY_MODE === 'ssg';
const isHybrid = DEPLOY_MODE === 'hybrid';
const useExternalAPI = isSSG || isHybrid;

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

  const baseUrl = useExternalAPI ? API_BASE_URL : '';
  const url = `${baseUrl}${path}`;

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
      };
    }

    return { data: json.data ?? json };
  } catch (err) {
    return { error: 'Network error', code: 'NETWORK_ERROR' };
  }
}

export function getApiBaseUrl(): string {
  return useExternalAPI ? API_BASE_URL : '';
}

export function isExternalApiMode(): boolean {
  return useExternalAPI;
}

export function apiUrl(path: string): string {
  const baseUrl = useExternalAPI ? API_BASE_URL : '';
  return `${baseUrl}${path}`;
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
