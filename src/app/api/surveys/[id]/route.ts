import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recordAudit } from '@/app/api/audit-logs/route';

// GET: Get a single survey with all its children
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const survey = await prisma.ictSurvey.findUnique({
    where: { id },
    include: {
      organization: true,
      submittedBy: { select: { fullName: true, officeEmail: true } },
      approvedBy: { select: { fullName: true } },
      hardwareAssets: true,
      softwareLicenses: true,
      infoSystems: true,
      networkAssets: true,
      attachments: true,
    },
  });

  if (!survey) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(survey);
}

// PATCH: Update survey status (approve/submit)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const user = session.user as any;
  const survey = await prisma.ictSurvey.findUnique({ where: { id } });
  if (!survey) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const transitions: Record<string, { next: string; roles: string[] }> = {
    DRAFT:              { next: 'SUBMITTED', roles: ['TENANT_IT', 'CENTRAL_IT'] },
    SUBMITTED:          { next: 'INSTITUTE_APPROVED', roles: ['TENANT_ADMIN'] },
    INSTITUTE_APPROVED: { next: 'MDS_REVIEWED', roles: ['CENTRAL_APPROVER', 'CENTRAL_IT'] },
    MDS_REVIEWED:       { next: 'COMPLETED', roles: ['CENTRAL_IT'] },
  };

  const transition = transitions[survey.status];
  if (!transition) return NextResponse.json({ error: 'Cannot advance this survey further' }, { status: 400 });
  if (!transition.roles.includes(user.role)) {
    return NextResponse.json({ error: 'Insufficient role for this action' }, { status: 403 });
  }

  const updated = await prisma.ictSurvey.update({
    where: { id },
    data: {
      status: transition.next,
      ...(transition.next === 'SUBMITTED' ? { submittedAt: new Date() } : {}),
      ...(transition.next === 'INSTITUTE_APPROVED' ? { approvedById: user.id, approvedAt: new Date() } : {}),
    },
  });

  // Record Audit Log
  await recordAudit({
    userId: user.id,
    userName: user.name || 'Unknown',
    userRole: user.role,
    organizationId: user.organizationId,
    action: `SURVEY_STATUS_${transition.next}`,
    entityType: 'IctSurvey',
    entityId: id,
    details: { from: survey.status, to: transition.next },
    req,
  });

  return NextResponse.json(updated);
}
