import type { APIRoute } from 'astro';
import { lucia } from '@lib/auth';
import { db } from '@db';
import { users, memberCards, memberTracks, sessions } from '@db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import QRCode from 'qrcode';
import { createErrorResponse, createSuccessResponse } from '@lib/api-utils';

export const POST: APIRoute = async ({ request, cookies }) => {
  const sessionId = cookies.get(lucia.sessionCookieName)?.value ?? null;
  
  if (!sessionId) {
    return createErrorResponse('Unauthorized', 401);
  }

  try {
    const { session, user } = await lucia.validateSession(sessionId);
    
    if (!session || !user || user.role !== 'maintainer') {
      return createErrorResponse('Forbidden', 403);
    }

    const body = await request.json();
    const { userId, action } = body;

    if (!userId || !action) {
      return createErrorResponse('Missing required fields', 400);
    }

    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!targetUser) {
      return createErrorResponse('User not found', 404);
    }

    if (action === 'approve') {
      // Use transaction for atomic operation
      await db.transaction(async (tx) => {
        // Update user status to active
        await tx.update(users)
          .set({
            status: 'active',
            approvedAt: Date.now(),
            approvedBy: user.name,
          })
          .where(eq(users.id, userId));

        // Generate member card with QR code (use card number only, not PII)
        const cardNumber = `SMAUII-${Date.now().toString(36).toUpperCase()}`;
        const qrData = JSON.stringify({
          cardNumber,
        });
        
        const qrCode = await QRCode.toDataURL(qrData);

        await tx.insert(memberCards).values({
          id: nanoid(),
          userId,
          cardNumber,
          qrCode,
          issuedAt: Date.now(),
        });
      });

      return createSuccessResponse({
        success: true,
        message: 'User approved successfully',
      });

    } else if (action === 'reject') {
      // Delete related records first (in transaction)
      await db.transaction(async (tx) => {
        await tx.delete(memberTracks).where(eq(memberTracks.userId, userId));
        await tx.delete(sessions).where(eq(sessions.userId, userId));
        await tx.delete(memberCards).where(eq(memberCards.userId, userId));
        await tx.delete(users).where(eq(users.id, userId));
      });

      return createSuccessResponse({
        success: true,
        message: 'User rejected and removed',
      });

    } else {
      return createErrorResponse('Invalid action', 400);
    }

  } catch (error) {
    console.error('Admin action error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};
