import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canCreateSurvey, isCentral } from '@/lib/roles';
import { recordAudit } from '@/app/api/audit-logs/route';

/**
 * POST: Bulk Import Hardware Assets into a Survey
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  const { id: surveyId } = await params;

  // 1. Verify survey and access
  const survey = await prisma.ictSurvey.findUnique({ where: { id: surveyId } });
  if (!survey) return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
  
  if (!isCentral(user.role) && survey.organizationId !== user.organizationId) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  if (survey.status !== 'DRAFT' && !isCentral(user.role)) {
    return NextResponse.json({ error: 'Cannot import into a non-draft survey' }, { status: 400 });
  }

  try {
    const { assets } = await req.json();
    if (!Array.isArray(assets)) return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });

    // 2. Map and Validate
    const hardwareData = assets.map((a: any) => ({
      surveyId,
      assetTag: String(a.assetTag || '').trim(),
      serialNumber: String(a.serialNumber || '').trim(),
      hostname: String(a.hostname || '').trim(),
      category: String(a.category || 'DESKTOP').toUpperCase(),
      make: String(a.make || 'Unknown'),
      model: String(a.model || 'Unknown'),
      processorModel: a.processorModel,
      ramGb: parseInt(a.ramGb) || 0,
      storageGb: parseInt(a.storageGb) || 0,
      storageType: a.storageType || 'SSD',
      currentOs: a.currentOs,
      win11Compatible: a.win11Compatible || 'UNKNOWN',
      purchaseDate: a.purchaseDate ? new Date(a.purchaseDate) : null,
      purchaseCostUsd: parseFloat(a.purchaseCost) || 0,
      condition: a.condition || 'OPERATIONAL',
      department: a.department,
      assignedToName: a.assignedTo,
    }));

    // 3. Batch Create
    const result = await prisma.hardwareAsset.createMany({
      data: hardwareData,
    });

    // 4. Record Audit Log
    await recordAudit({
      userId: user.id,
      userName: user.name || 'Unknown',
      userRole: user.role,
      organizationId: user.organizationId,
      action: 'BULK_IMPORT_HARDWARE',
      entityType: 'IctSurvey',
      entityId: surveyId,
      details: { count: result.count },
      req,
    });

    return NextResponse.json({ 
      success: true, 
      count: result.count,
      message: `Successfully imported ${result.count} assets`
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Import failed: ' + error.message }, { status: 500 });
  }
}
