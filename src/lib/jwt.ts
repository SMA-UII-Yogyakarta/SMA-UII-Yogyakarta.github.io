import { createHmac, timingSafeEqual } from 'crypto';

interface ResetTokenPayload {
  sub: string;
  purpose: 'reset';
  iat: number;
  exp: number;
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET || process.env.RESEND_API_KEY;
  if (!secret) {
    throw new Error(
      'AUTH_SECRET or RESEND_API_KEY is required for JWT signing. ' +
      'Set AUTH_SECRET in your environment variables.'
    );
  }
  return new TextEncoder().encode(secret);
}

function base64UrlEncode(buf: Uint8Array): string {
  return Buffer.from(buf).toString('base64url');
}

function base64UrlDecode(str: string): Uint8Array {
  return new Uint8Array(Buffer.from(str, 'base64url'));
}

function textEncode(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function textDecode(buf: Uint8Array): string {
  return new TextDecoder().decode(buf);
}

export async function signResetToken(userId: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: 'HS256', typ: 'JWT' };
  const payload: ResetTokenPayload = {
    sub: userId,
    purpose: 'reset',
    iat: now,
    exp: now + 3600,
  };

  const secret = getSecret();
  const headerB64 = base64UrlEncode(textEncode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(textEncode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const signature = base64UrlEncode(
    new Uint8Array(createHmac('sha256', secret).update(signingInput).digest())
  );

  return `${signingInput}.${signature}`;
}

export async function verifyResetToken(token: string): Promise<string | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const signingInput = `${headerB64}.${payloadB64}`;
    const secret = getSecret();

    const expectedSig = base64UrlEncode(
      new Uint8Array(createHmac('sha256', secret).update(signingInput).digest())
    );

    const sigBuf = textEncode(signatureB64);
    const expectedBuf = textEncode(expectedSig);

    if (sigBuf.length !== expectedBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

    const payloadBytes = base64UrlDecode(payloadB64);
    const payload: ResetTokenPayload = JSON.parse(textDecode(payloadBytes));

    if (payload.purpose !== 'reset') return null;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;

    return payload.sub;
  } catch {
    return null;
  }
}
