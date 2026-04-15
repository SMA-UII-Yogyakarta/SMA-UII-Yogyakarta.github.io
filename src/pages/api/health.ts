import type { APIRoute } from 'astro';
import { createSuccessResponse } from '@lib/api-utils';

export const GET: APIRoute = async () => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  };
  
  return createSuccessResponse(health);
};
