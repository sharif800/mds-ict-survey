import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: List surveys for the current org (or all for CENTRAL roles)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  const isCentral = ['CENTRAL_APPROVER', 'CENTRAL_IT', 'CENTRAL_VIEWER'].includes(user.role);

  const surveys = await prisma.ictSurvey.findMany({
    where: isCentral ? {} : { organizationId: user.organizationId },
    orderBy: { createdAt: 'desc' },
    include: {
      organization: { select: { name: true, tenantName: true } },
      submittedBy: { select: { fullName: true } },
      _count: {
        select: { hardwareAssets: true, softwareLicenses: true, infoSystems: true, networkAssets: true },
      },
    },
  });

  return NextResponse.json(surveys);
}

// POST: Create a new survey
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  if (!['TENANT_IT', 'CENTRAL_IT'].includes(user.role)) {
    return NextResponse.json({ error: 'Only IT officers can create surveys' }, { status: 403 });
  }

  const body = await req.json();
  const { surveyYear, quarter } = body;

  // Check for duplicate
  const existing = await prisma.ictSurvey.findFirst({
    where: { organizationId: user.organizationId, surveyYear, quarter: quarter || null },
  });
  if (existing) {
    return NextResponse.json({ error: 'A survey for this period already exists' }, { status: 409 });
  }

  const org = await prisma.organization.findUnique({ where: { id: user.organizationId } });
  const ref = `ICT-${surveyYear}-${org?.tenantName?.toUpperCase() || 'ORG'}${quarter ? `-Q${quarter}` : ''}`;

  const survey = await prisma.ictSurvey.create({
    data: {
      organizationId: user.organizationId,
      surveyYear,
      quarter: quarter || null,
      submittedById: user.id,
      referenceNumber: ref,
      status: 'DRAFT',
    },
  });

  return NextResponse.json(survey, { status: 201 });
}
