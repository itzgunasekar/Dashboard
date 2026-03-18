export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/security/jwt';
import { encrypt, decrypt } from '@/lib/security/encryption';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

/** GET: Generate 2FA secret and QR code */
export async function GET(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const secret = speakeasy.generateSecret({
    name: `AETHER:${user.email}`,
    issuer: 'AETHER Trading',
  });

  // Store secret encrypted (not yet verified)
  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorSecret: encrypt(secret.base32) },
  });

  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

  return NextResponse.json({
    secret: secret.base32,
    qrCode: qrCodeUrl,
  });
}

/** POST: Verify and enable 2FA */
export async function POST(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { code } = await req.json();

  if (!user.twoFactorSecret) {
    return NextResponse.json({ error: 'Generate 2FA secret first' }, { status: 400 });
  }

  const decryptedSecret = decrypt(user.twoFactorSecret);
  const verified = speakeasy.totp.verify({
    secret: decryptedSecret,
    encoding: 'base32',
    token: code,
    window: 1,
  });

  if (!verified) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: true },
  });

  await prisma.auditLog.create({
    data: { userId: user.id, action: '2FA_ENABLED', resource: 'User' },
  });

  return NextResponse.json({ message: '2FA enabled successfully' });
}

/** DELETE: Disable 2FA */
export async function DELETE(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });

  return NextResponse.json({ message: '2FA disabled' });
}
