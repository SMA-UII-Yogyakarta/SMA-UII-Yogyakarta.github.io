import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendApprovalEmail(to: string, name: string): Promise<void> {
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

export async function sendAnnouncementEmail(to: string, title: string, content: string): Promise<void> {
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
