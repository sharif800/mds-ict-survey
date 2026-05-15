import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isCentral, canViewCosts, getOrgFilter } from '@/lib/roles';

/**
 * Reports API — Generates printable JSON data for standard government reports.
 * Query: ?type=hardware_summary|win11_readiness|software_audit|depreciation|survey_status
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'hardware_summary';
  const orgId = searchParams.get('orgId'); // Central can filter by specific org

  const orgFilter = isCentral(user.role)
    ? (orgId ? { organizationId: orgId } : {})
    : { organizationId: user.organizationId };
  const surveyFilter = isCentral(user.role)
    ? (orgId ? { survey: { organizationId: orgId } } : {})
    : { survey: { organizationId: user.organizationId } };

  const showCosts = canViewCosts(user.role);

  switch (type) {
    case 'hardware_summary': {
      const assets = await prisma.hardwareAsset.findMany({
        where: surveyFilter,
        include: { survey: { include: { organization: { select: { name: true, tenantName: true } } } } },
        orderBy: { createdAt: 'desc' },
      });

      const summary = {
        reportTitle: 'Hardware Asset Summary Report',
        generatedAt: new Date().toISOString(),
        generatedBy: user.name,
        totalAssets: assets.length,
        byCategory: Object.entries(
          assets.reduce((acc: Record<string, number>, a) => { acc[a.category] = (acc[a.category] || 0) + 1; return acc; }, {})
        ).map(([category, count]) => ({ category, count })),
        byCondition: Object.entries(
          assets.reduce((acc: Record<string, number>, a) => { const c = a.condition || 'UNKNOWN'; acc[c] = (acc[c] || 0) + 1; return acc; }, {})
        ).map(([condition, count]) => ({ condition, count })),
        totalValue: showCosts ? assets.reduce((s, a) => s + (a.purchaseCostUsd || 0), 0) : undefined,
        assets: assets.map(a => ({
          assetTag: a.assetTag,
          category: a.category,
          make: a.make,
          model: a.model,
          serialNumber: a.serialNumber,
          processorModel: a.processorModel,
          ramGb: a.ramGb,
          storageGb: a.storageGb,
          currentOs: a.currentOs,
          condition: a.condition,
          department: a.department,
          assignedTo: a.assignedToName,
          purchaseDate: a.purchaseDate,
          purchaseCost: showCosts ? a.purchaseCostUsd : undefined,
          organization: a.survey.organization.name,
        })),
      };
      return NextResponse.json(summary);
    }

    case 'win11_readiness': {
      const assets = await prisma.hardwareAsset.findMany({
        where: { ...surveyFilter, category: { in: ['DESKTOP', 'LAPTOP'] } },
        include: { survey: { include: { organization: { select: { name: true } } } } },
      });

      const compatible = assets.filter(a => a.win11Compatible === 'YES');
      const notCompatible = assets.filter(a => a.win11Compatible === 'NO');
      const unknown = assets.filter(a => a.win11Compatible === 'UNKNOWN' || !a.win11Compatible);

      return NextResponse.json({
        reportTitle: 'Windows 11 Readiness Report',
        generatedAt: new Date().toISOString(),
        generatedBy: user.name,
        totalDevices: assets.length,
        compatible: compatible.length,
        notCompatible: notCompatible.length,
        unknown: unknown.length,
        readinessPercent: assets.length > 0 ? Math.round((compatible.length / assets.length) * 100) : 0,
        incompatibleDevices: notCompatible.map(a => ({
          make: a.make, model: a.model, processor: a.processorModel,
          ram: a.ramGb, tpm: a.tpmVersion, os: a.currentOs,
          department: a.department, assignedTo: a.assignedToName,
          organization: a.survey.organization.name,
        })),
      });
    }

    case 'software_audit': {
      const licenses = await prisma.softwareLicense.findMany({
        where: surveyFilter,
        include: { survey: { include: { organization: { select: { name: true } } } } },
      });

      const expiringSoon = licenses.filter(l => {
        if (!l.expiryDate) return false;
        const daysLeft = (new Date(l.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return daysLeft > 0 && daysLeft <= 90;
      });

      return NextResponse.json({
        reportTitle: 'Software License Audit Report',
        generatedAt: new Date().toISOString(),
        generatedBy: user.name,
        totalLicenses: licenses.length,
        totalQuantity: licenses.reduce((s, l) => s + l.quantity, 0),
        totalAssigned: licenses.reduce((s, l) => s + l.assignedQty, 0),
        totalCost: showCosts ? licenses.reduce((s, l) => s + (l.annualCostUsd || 0), 0) : undefined,
        expiringSoon: expiringSoon.length,
        licenses: licenses.map(l => ({
          name: l.softwareName, vendor: l.vendor, type: l.licenseType,
          quantity: l.quantity, assigned: l.assignedQty,
          cost: showCosts ? l.annualCostUsd : undefined,
          expiry: l.expiryDate, organization: l.survey.organization.name,
        })),
      });
    }

    case 'depreciation': {
      const assets = await prisma.hardwareAsset.findMany({
        where: { ...surveyFilter, purchaseDate: { not: null } },
        include: { survey: { include: { organization: { select: { name: true } } } } },
      });

      const now = new Date();
      const report = assets.map(a => {
        const purchaseDate = new Date(a.purchaseDate!);
        const lifeYears = a.expectedLifeYears || 5;
        const ageYears = (now.getTime() - purchaseDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        const cost = a.purchaseCostUsd || 0;
        const annualDep = cost / lifeYears;
        const accumulated = Math.min(annualDep * ageYears, cost);
        const bookValue = Math.max(cost - accumulated, 0);
        const pastLife = ageYears >= lifeYears;

        return {
          assetTag: a.assetTag, category: a.category, make: a.make, model: a.model,
          purchaseDate: a.purchaseDate, lifeYears,
          ageYears: Math.round(ageYears * 10) / 10,
          purchaseCost: showCosts ? cost : undefined,
          bookValue: showCosts ? Math.round(bookValue * 100) / 100 : undefined,
          accumulatedDep: showCosts ? Math.round(accumulated * 100) / 100 : undefined,
          pastLife, department: a.department,
          organization: a.survey.organization.name,
        };
      });

      return NextResponse.json({
        reportTitle: 'Asset Depreciation & Lifecycle Report',
        generatedAt: new Date().toISOString(),
        generatedBy: user.name,
        totalAssets: report.length,
        pastLifeCount: report.filter(r => r.pastLife).length,
        totalOriginalValue: showCosts ? report.reduce((s, r) => s + (r.purchaseCost || 0), 0) : undefined,
        totalBookValue: showCosts ? report.reduce((s, r) => s + (r.bookValue || 0), 0) : undefined,
        assets: report,
      });
    }

    case 'survey_status': {
      const surveys = await prisma.ictSurvey.findMany({
        where: orgFilter,
        include: {
          organization: { select: { name: true, tenantName: true } },
          submittedBy: { select: { fullName: true } },
          _count: { select: { hardwareAssets: true, softwareLicenses: true, infoSystems: true, networkAssets: true, attachments: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({
        reportTitle: 'Survey Submission Status Report',
        generatedAt: new Date().toISOString(),
        generatedBy: user.name,
        totalSurveys: surveys.length,
        byStatus: Object.entries(
          surveys.reduce((acc: Record<string, number>, s) => { acc[s.status] = (acc[s.status] || 0) + 1; return acc; }, {})
        ).map(([status, count]) => ({ status, count })),
        surveys: surveys.map(s => ({
          reference: s.referenceNumber,
          organization: s.organization.name,
          year: s.surveyYear, quarter: s.quarter,
          status: s.status, submittedBy: s.submittedBy.fullName,
          submittedAt: s.submittedAt, approvedAt: s.approvedAt,
          hardware: s._count.hardwareAssets, software: s._count.softwareLicenses,
          systems: s._count.infoSystems, network: s._count.networkAssets,
          attachments: s._count.attachments,
        })),
      });
    }

    default:
      return NextResponse.json({ error: 'Unknown report type' }, { status: 400 });
  }
}
