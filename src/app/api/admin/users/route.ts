import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/security/jwt';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const admin = await authenticateAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
  const search = url.searchParams.get('search') || '';

  const where = search ? {
    OR: [
      { email: { contains: search, mode: 'insensitive' as const } },
      { fullName: { contains: search, mode: 'insensitive' as const } },
    ],
  } : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, email: true, fullName: true, role: true, status: true,
        emailVerified: true, twoFactorEnabled: true, lastLoginAt: true, createdAt: true,
        subscription: { select: { plan: true, status: true } },
        brokerAccounts: { select: { id: true, broker: true, status: true } },
        botInstances: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, totalPages: Math.ceil(total / limit) });
}

/** Admin: Update user status (suspend/ban/activate) */
export async function PATCH(req: NextRequest) {
  const admin = await authenticateAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

  const { userId, action } = await req.json();

  const statusMap: Record<string, string> = {
    activate: 'ACTIVE',
    suspend: 'SUSPENDED',
    ban: 'BANNED',
  };

  const newStatus = statusMap[action];
  if (!newStatus) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  await prisma.user.update({ where: { id: userId }, data: { status: newStatus as any } });

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: `ADMIN_USER_${action.toUpperCase()}`,
      resource: 'User',
      resourceId: userId,
    },
  });

  return NextResponse.json({ message: `User ${action}d` });
}
