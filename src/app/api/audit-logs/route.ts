import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isCentral } from '@/lib/roles';

/**
 * GET: Fetch audit logs (Central Admin only)
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  if (!isCentral(user.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get('orgId');
  const action = searchParams.get('action');

  const filter: any = {};
  if (orgId) filter.organizationId = orgId;
  if (action) filter.action = action;

  const logs = await prisma.auditLog.findMany({
    where: filter,
    orderBy: { timestamp: 'desc' },
    take: 100,
  });

  return NextResponse.json(logs);
}

/**
 * Helper to record audit logs (to be used in other API routes)
 */
export async function recordAudit(data: {
  userId: string;
  userName: string;
  userRole: string;
  organizationId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: any;
  req?: Request;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        userName: data.userName,
        userRole: data.userRole,
        organizationId: data.organizationId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        details: data.details ? JSON.stringify(data.details) : null,
        ipAddress: data.req?.headers.get('x-forwarded-for') || '127.0.0.1',
      }
    });
  } catch (err) {
    console.error('Failed to record audit log:', err);
  }
}
