import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isCentral } from '@/lib/roles';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  const filter = isCentral(user.role)
    ? {}
    : { organizationId: user.organizationId };

  const mappings = await prisma.m365UserDeviceMap.findMany({
    where: filter,
    include: {
      organization: { select: { name: true, tenantName: true } },
      hardwareAsset: { select: { make: true, model: true, category: true } },
    },
    orderBy: { lastSyncDate: 'desc' },
  });

  return NextResponse.json(mappings);
}
