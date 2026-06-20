import type { APIRoute } from 'astro';
import { createSuccessResponse, createErrorResponse } from '@smauii/shared';
import { db } from '@smauii/db';
import { users } from '@smauii/db';
import { sql } from 'drizzle-orm';

export const GET: APIRoute = async () => {
  try {
    // Check database connection
    await db.select({ count: sql`1` }).from(users).limit(1);
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: 'connected',
    };
    
    return createSuccessResponse(health);
  } catch (error) {
    console.error('Health check failed:', error);
    return createErrorResponse('Database connection failed', 500, {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
    });
  }
};
