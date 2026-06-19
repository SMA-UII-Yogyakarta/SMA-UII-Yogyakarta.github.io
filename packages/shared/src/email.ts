import { Resend } from 'resend';

// Initialize resend only if API key exists (non-blocking for development)
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Helper to check if email is enabled
function isEmailEnabled(): boolean {
  return resend !== null;
}

const BASE_URL = process.env.PUBLIC_BASE_URL || 'https://lab.smauiiyk.sch.id';

export async function sendApprovalEmail(to: string, name: string): Promise<void> {
  if (!resend) {
    console.warn('Email not configured (missing RESEND_API_KEY). Skipping approval email.');
    return;
  }

  await resend.emails.send({
    from: 'SMAUII Lab <noreply@lab.smauiiyk.sch.id>',
    to,
    subject: '✅ Akun Lab Digital Kamu Sudah Disetujui!',
    html: `
      <h2>Halo ${name}!</h2>
      <p>Selamat! Akun Lab Digital kamu sudah disetujui oleh maintainer.</p>
      <p>Sekarang kamu bisa:</p>
      <ul>
        <li>Login ke dashboard</li>
        <li>Download kartu anggota digital</li>
        <li>Akses semua materi pembelajaran</li>
        <li>Submit project dan activity</li>
      </ul>
      <p><a href="https://lab.smauiiyk.sch.id/app">Login Sekarang →</a></p>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
  if (!resend) {
    console.warn('Email not configured (missing RESEND_API_KEY). Skipping password reset email.');
    return;
  }

  const resetLink = `${BASE_URL}/reset-password?token=${encodeURIComponent(token)}`;

  await resend.emails.send({
    from: 'SMAUII Lab <noreply@lab.smauiiyk.sch.id>',
    to,
    subject: '🔑 Reset Password — SMA UII Lab',
    html: `
      <h2>Halo ${name}!</h2>
      <p>Kami menerima permintaan reset password untuk akun kamu di SMA UII Lab.</p>
      <p>Klik tombol di bawah ini untuk mengatur ulang password:</p>
      <p style="margin: 24px 0;">
        <a href="${resetLink}"
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Reset Password
        </a>
      </p>
      <p style="color: #666; font-size: 13px;">
        Tautan ini berlaku selama 1 jam.<br>
        Jika kamu tidak meminta reset password, abaikan email ini.
      </p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #666; font-size: 12px;">
        Email ini dikirim otomatis dari Lab Digital SMA UII Yogyakarta.<br>
        <a href="${BASE_URL}">lab.smauiiyk.sch.id</a>
      </p>
    `,
  });
}

export async function sendAnnouncementEmail(to: string, title: string, content: string): Promise<void> {
  if (!resend) {
    console.warn('Email not configured (missing RESEND_API_KEY). Skipping announcement email.');
    return;
  }

  await resend.emails.send({
    from: 'SMAUII Lab <noreply@lab.smauiiyk.sch.id>',
    to,
    subject: `📢 ${title}`,
    html: `
      <h2>${title}</h2>
      <div>${content}</div>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #666; font-size: 12px;">
        Email ini dikirim otomatis dari Lab Digital SMA UII Yogyakarta.
        <a href="https://lab.smauiiyk.sch.id">lab.smauiiyk.sch.id</a>
      </p>
    `,
  });
}

export async function sendRegistrationEmail(to: string, name: string): Promise<void> {
  if (!resend) {
    console.warn('Email not configured (missing RESEND_API_KEY). Skipping registration email.');
    return;
  }

  await resend.emails.send({
    from: 'SMAUII Lab <noreply@lab.smauiiyk.sch.id>',
    to,
    subject: '📝 Pendaftaran Diterima',
    html: `
      <h2>Halo ${name}!</h2>
      <p>Terima kasih sudah mendaftar ke Lab Digital SMA UII Yogyakarta.</p>
      <p>Pendaftaran kamu sudah <strong>diterima</strong> dan saat ini sedang dalam proses peninjauan oleh maintainer.</p>
      <p>Kamu akan menerima email pemberitahuan setelah akun kamu disetujui.</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #666; font-size: 12px;">
        Email ini dikirim otomatis dari Lab Digital SMA UII Yogyakarta.
        <a href="https://lab.smauiiyk.sch.id">lab.smauiiyk.sch.id</a>
      </p>
    `,
  });
}

export async function sendRejectionEmail(to: string, name: string): Promise<void> {
  if (!resend) {
    console.warn('Email not configured (missing RESEND_API_KEY). Skipping rejection email.');
    return;
  }

  await resend.emails.send({
    from: 'SMAUII Lab <noreply@lab.smauiiyk.sch.id>',
    to,
    subject: 'Pendaftaran Ditolak',
    html: `
      <h2>Halo ${name},</h2>
      <p>Terima kasih atas minat kamu untuk bergabung dengan Lab Digital SMA UII Yogyakarta.</p>
      <p>Setelah melalui proses peninjauan, dengan berat hati kami informasikan bahwa pendaftaran kamu <strong>belum dapat disetujui</strong> untuk saat ini.</p>
      <p>Jangan berkecil hati! Kamu tetap bisa mendaftar kembali di lain kesempatan. Tetap semangat belajar dan berkarya!</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #666; font-size: 12px;">
        Email ini dikirim otomatis dari Lab Digital SMA UII Yogyakarta.
        <a href="https://lab.smauiiyk.sch.id">lab.smauiiyk.sch.id</a>
      </p>
    `,
  });
}
