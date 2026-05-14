import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST: Add hardware asset(s) to a survey
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // Support single or bulk import
  const assets = Array.isArray(body) ? body : [body];

  const created = await prisma.hardwareAsset.createMany({
    data: assets.map((a: any) => ({
      surveyId: id,
      assetTag: a.assetTag || null,
      serialNumber: a.serialNumber || null,
      hostname: a.hostname || null,
      category: a.category || 'OTHER',
      make: a.make || 'Unknown',
      model: a.model || 'Unknown',
      processorModel: a.processorModel || null,
      processorCores: a.processorCores ? Number(a.processorCores) : null,
      ramGb: a.ramGb ? Number(a.ramGb) : null,
      storageGb: a.storageGb ? Number(a.storageGb) : null,
      storageType: a.storageType || null,
      gpuModel: a.gpuModel || null,
      currentOs: a.currentOs || null,
      win11Compatible: computeWin11Compat(a),
      tpmVersion: a.tpmVersion || null,
      secureBootEnabled: a.secureBootEnabled ?? null,
      purchaseDate: a.purchaseDate ? new Date(a.purchaseDate) : null,
      warrantyExpiry: a.warrantyExpiry ? new Date(a.warrantyExpiry) : null,
      expectedLifeYears: a.expectedLifeYears ? Number(a.expectedLifeYears) : 5,
      purchaseCostUsd: a.purchaseCostUsd ? Number(a.purchaseCostUsd) : null,
      condition: a.condition || 'OPERATIONAL',
      location: a.location || null,
      department: a.department || null,
      assignedToName: a.assignedToName || null,
      assignedToEmail: a.assignedToEmail || null,
    })),
  });

  return NextResponse.json({ count: created.count }, { status: 201 });
}

// Auto-compute Win11 compatibility based on specs
function computeWin11Compat(asset: any): string {
  // If explicitly set, respect it
  if (asset.win11Compatible && asset.win11Compatible !== 'UNKNOWN') return asset.win11Compatible;

  const ram = Number(asset.ramGb || 0);
  const storage = Number(asset.storageGb || 0);
  const tpm = asset.tpmVersion;
  const cpu = (asset.processorModel || '').toLowerCase();

  // Basic disqualifiers
  if (ram > 0 && ram < 4) return 'NO';
  if (storage > 0 && storage < 64) return 'NO';
  if (tpm && tpm !== '2.0') return 'NO';

  // CPU generation check (simplified Intel/AMD check)
  if (cpu.includes('intel')) {
    // Intel 8th gen+ required (i-8xxx, i-9xxx, i-10xxx, i-11xxx, i-12xxx, i-13xxx, i-14xxx)
    const genMatch = cpu.match(/i[357]-(\d)/);
    if (genMatch) {
      const gen = parseInt(genMatch[1]);
      if (gen < 8) return 'NO';
      if (gen >= 8) return ram >= 4 && (tpm === '2.0' || !tpm) ? 'YES' : 'UNKNOWN';
    }
  }

  if (cpu.includes('ryzen') || cpu.includes('amd')) {
    // AMD Zen 2+ (Ryzen 3000+)
    const ryzenMatch = cpu.match(/ryzen\s*\d\s*(\d)/);
    if (ryzenMatch) {
      const series = parseInt(ryzenMatch[1]);
      if (series >= 3) return ram >= 4 && (tpm === '2.0' || !tpm) ? 'YES' : 'UNKNOWN';
      return 'NO';
    }
  }

  return 'UNKNOWN';
}
