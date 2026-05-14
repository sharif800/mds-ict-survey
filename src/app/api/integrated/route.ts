import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Integrated View API
 * Aggregates data from the ICT Survey portal and provides a unified picture.
 * For cross-portal M365 data, we'll use the M365UserDeviceMap model.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  const isCentral = ['CENTRAL_APPROVER', 'CENTRAL_IT', 'CENTRAL_VIEWER'].includes(user.role);
  const orgFilter = isCentral ? {} : { organizationId: user.organizationId };

  // Total hardware across surveys
  const totalHardware = await prisma.hardwareAsset.count({
    where: { survey: orgFilter },
  });

  // Win11 readiness breakdown
  const win11Stats = await prisma.hardwareAsset.groupBy({
    by: ['win11Compatible'],
    where: {
      survey: orgFilter,
      category: { in: ['DESKTOP', 'LAPTOP'] },
    },
    _count: { id: true },
  });

  // Hardware by category
  const hardwareByCategory = await prisma.hardwareAsset.groupBy({
    by: ['category'],
    where: { survey: orgFilter },
    _count: { id: true },
  });

  // Software license count
  const totalSoftware = await prisma.softwareLicense.count({
    where: { survey: orgFilter },
  });

  // Information systems count
  const totalSystems = await prisma.informationSystem.count({
    where: { survey: orgFilter },
  });

  // M365 user-device mappings
  const m365Mappings = await prisma.m365UserDeviceMap.count({
    where: isCentral ? {} : { organizationId: user.organizationId },
  });

  // Survey status overview
  const surveyStatuses = await prisma.ictSurvey.groupBy({
    by: ['status'],
    where: orgFilter,
    _count: { id: true },
  });

  // Depreciation: assets past expected life
  const now = new Date();
  const agingAssets = await prisma.hardwareAsset.findMany({
    where: {
      survey: orgFilter,
      purchaseDate: { not: null },
    },
    select: { id: true, purchaseDate: true, expectedLifeYears: true, make: true, model: true, category: true },
  });

  const pastLife = agingAssets.filter(a => {
    if (!a.purchaseDate || !a.expectedLifeYears) return false;
    const endDate = new Date(a.purchaseDate);
    endDate.setFullYear(endDate.getFullYear() + a.expectedLifeYears);
    return now > endDate;
  });

  // Per-organization breakdown (for central users)
  let orgBreakdown: any[] = [];
  if (isCentral) {
    const orgs = await prisma.organization.findMany({
      select: {
        id: true, name: true, tenantName: true,
        ictSurveys: {
          select: {
            _count: { select: { hardwareAssets: true, softwareLicenses: true, infoSystems: true } },
          },
        },
      },
    });
    orgBreakdown = orgs.map(org => ({
      name: org.name,
      tenantName: org.tenantName,
      hardware: org.ictSurveys.reduce((sum, s) => sum + s._count.hardwareAssets, 0),
      software: org.ictSurveys.reduce((sum, s) => sum + s._count.softwareLicenses, 0),
      systems: org.ictSurveys.reduce((sum, s) => sum + s._count.infoSystems, 0),
    })).filter(o => o.hardware > 0 || o.software > 0);
  }

  return NextResponse.json({
    totalHardware,
    totalSoftware,
    totalSystems,
    m365Mappings,
    win11Stats: win11Stats.map(s => ({ status: s.win11Compatible, count: s._count.id })),
    hardwareByCategory: hardwareByCategory.map(h => ({ category: h.category, count: h._count.id })),
    surveyStatuses: surveyStatuses.map(s => ({ status: s.status, count: s._count.id })),
    assetsNeedingReplacement: pastLife.length,
    orgBreakdown,
  });
}
