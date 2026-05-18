import type { APIRoute } from 'astro';
import { db } from '@smauii/db';
import { users, memberCards, memberTracks, sessions } from '@smauii/db';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import QRCode from 'qrcode';
import { createErrorResponse, createSuccessResponse } from '@smauii/shared';
import { approveUserSchema } from '@smauii/validation';
import { createNotification } from '@smauii/shared';
import { sendApprovalEmail, sendRejectionEmail } from '@smauii/shared';

export const POST: APIRoute = async ({ request, locals }) => {
  const { user } = locals;
  if (!user || user.role !== 'maintainer') {
    return createErrorResponse('Forbidden', 403);
  }

  try {
    const body = await request.json();
    const parsed = approveUserSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return createErrorResponse(firstError.message, 400);
    }

    const { userId, action } = parsed.data;
    const targetUser = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!targetUser) return createErrorResponse('User not found', 404);

    if (action === 'approve') {
      await db.transaction(async (tx) => {
        await tx.update(users)
          .set({ status: 'active', approvedAt: Date.now(), approvedBy: user.name })
          .where(eq(users.id, userId));

        const cardNumber = `SMAUII-${Date.now().toString(36).toUpperCase()}`;
        const qrCode = await QRCode.toDataURL(JSON.stringify({ cardNumber }));
        await tx.insert(memberCards).values({ id: nanoid(), userId, cardNumber, qrCode, issuedAt: Date.now() });
      });
      // Notifikasi ke member yang diapprove
      await createNotification(userId, `Selamat! Akun kamu telah disetujui. Kartu anggota sudah tersedia.`);
      // Kirim email approval
      if (targetUser.email) {
        await sendApprovalEmail(targetUser.email, targetUser.name).catch(err => 
          console.error('Failed to send approval email:', err)
        );
      }
      return createSuccessResponse({ success: true, message: 'User approved successfully' });

    } else if (action === 'reject') {
      if (targetUser.email) {
        sendRejectionEmail(targetUser.email, targetUser.name).catch(err =>
          console.error('Failed to send rejection email:', err)
        );
      }
      await db.transaction(async (tx) => {
        await tx.delete(memberTracks).where(eq(memberTracks.userId, userId));
        await tx.delete(sessions).where(eq(sessions.userId, userId));
        await tx.delete(memberCards).where(eq(memberCards.userId, userId));
        await tx.delete(users).where(eq(users.id, userId));
      });
      return createSuccessResponse({ success: true, message: 'User rejected and removed' });

    } else {
      return createErrorResponse('Invalid action', 400);
    }
  } catch (error) {
    console.error('Admin action error:', error);
    return createErrorResponse('Internal server error', 500);
  }
};
