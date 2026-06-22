// Stub for all pages/api routes in SSG mode.
// These endpoints are handled by the Hono API server at runtime.
// This file exists only to satisfy Astro's build system in static mode.

import type { APIRoute } from 'astro';

export const GET: APIRoute = () =>
  new Response(JSON.stringify({ error: 'Not available in static mode' }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = GET;
export const PUT: APIRoute = GET;
export const PATCH: APIRoute = GET;
export const DELETE: APIRoute = GET;
