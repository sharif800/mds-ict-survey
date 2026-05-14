const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ICT Survey Portal...');

  // Create organizations (mirror from M365 portal)
  const era = await prisma.organization.upsert({
    where: { tenantName: 'era' },
    update: {},
    create: {
      name: 'Energy Regulatory Authority',
      institute: 'ERA',
      address: 'Ameenee Magu, Malé',
      phone: '+960 3015612',
      email: 'info@era.gov.mv',
      tenantName: 'era',
      instituteNumber: '2.1',
    },
  });

  const mtcc = await prisma.organization.upsert({
    where: { tenantName: 'mtcc' },
    update: {},
    create: {
      name: 'Maldives Transport and Contracting Company',
      institute: 'MTCC',
      address: 'Boduthakurufaanu Magu, Malé',
      phone: '+960 3323991',
      email: 'info@mtcc.com.mv',
      tenantName: 'mtcc',
      instituteNumber: '2.2',
    },
  });

  // Create users
  const pw = await bcrypt.hash('password123', 12);

  const eraIt = await prisma.user.upsert({
    where: { officeEmail: 'it@era.gov.mv' },
    update: {},
    create: {
      nationalId: 'A000001',
      fullName: 'Ahmed Rasheed',
      officeEmail: 'it@era.gov.mv',
      role: 'TENANT_IT',
      organizationId: era.id,
      password: pw,
      jobTitle: 'IT Officer',
    },
  });

  const eraAdmin = await prisma.user.upsert({
    where: { officeEmail: 'admin@era.gov.mv' },
    update: {},
    create: {
      nationalId: 'A000002',
      fullName: 'Fathimath Nazla',
      officeEmail: 'admin@era.gov.mv',
      role: 'TENANT_ADMIN',
      organizationId: era.id,
      password: pw,
      jobTitle: 'Director General',
    },
  });

  await prisma.user.upsert({
    where: { officeEmail: 'it@mtcc.com.mv' },
    update: {},
    create: {
      nationalId: 'A000003',
      fullName: 'Ibrahim Waheed',
      officeEmail: 'it@mtcc.com.mv',
      role: 'TENANT_IT',
      organizationId: mtcc.id,
      password: pw,
      jobTitle: 'IT Manager',
    },
  });

  const mdsAdmin = await prisma.user.upsert({
    where: { officeEmail: 'admin@digital.gov.mv' },
    update: {},
    create: {
      nationalId: 'A000010',
      fullName: 'Mohamed Shareef',
      officeEmail: 'admin@digital.gov.mv',
      role: 'CENTRAL_IT',
      organizationId: null,
      password: pw,
      jobTitle: 'MDS System Administrator',
    },
  });

  // Create a sample survey with hardware data
  const survey = await prisma.ictSurvey.upsert({
    where: { referenceNumber: 'ICT-2026-ERA-Q1' },
    update: {},
    create: {
      organizationId: era.id,
      surveyYear: 2026,
      quarter: 1,
      submittedById: eraIt.id,
      referenceNumber: 'ICT-2026-ERA-Q1',
      status: 'SUBMITTED',
      submittedAt: new Date(),
    },
  });

  // Sample hardware assets
  const hardware = [
    { category: 'LAPTOP', make: 'Dell', model: 'Latitude 5530', processorModel: 'Intel Core i5-1245U', ramGb: 16, storageGb: 512, storageType: 'NVME', currentOs: 'Windows 11 Pro', win11Compatible: 'YES', tpmVersion: '2.0', purchaseDate: new Date('2024-03-15'), purchaseCostUsd: 1200, condition: 'OPERATIONAL', department: 'IT', assignedToName: 'Ahmed Rasheed', assignedToEmail: 'it@era.gov.mv' },
    { category: 'DESKTOP', make: 'HP', model: 'ProDesk 400 G7', processorModel: 'Intel Core i5-10500', ramGb: 8, storageGb: 256, storageType: 'SSD', currentOs: 'Windows 10 Pro', win11Compatible: 'YES', tpmVersion: '2.0', purchaseDate: new Date('2022-01-10'), purchaseCostUsd: 800, condition: 'OPERATIONAL', department: 'Finance', assignedToName: 'Aishath Noor', assignedToEmail: 'finance@era.gov.mv' },
    { category: 'DESKTOP', make: 'Dell', model: 'OptiPlex 3050', processorModel: 'Intel Core i5-7500', ramGb: 8, storageGb: 500, storageType: 'HDD', currentOs: 'Windows 10 Pro', win11Compatible: 'NO', tpmVersion: '1.2', purchaseDate: new Date('2018-06-20'), purchaseCostUsd: 650, condition: 'OPERATIONAL', department: 'Legal', assignedToName: 'Hassan Ali', assignedToEmail: 'legal@era.gov.mv' },
    { category: 'LAPTOP', make: 'Lenovo', model: 'ThinkPad T14s', processorModel: 'AMD Ryzen 5 PRO 6650U', ramGb: 16, storageGb: 512, storageType: 'NVME', currentOs: 'Windows 11 Pro', win11Compatible: 'YES', tpmVersion: '2.0', purchaseDate: new Date('2024-08-01'), purchaseCostUsd: 1350, condition: 'OPERATIONAL', department: 'Engineering', assignedToName: 'Fathimath Nazla', assignedToEmail: 'admin@era.gov.mv' },
    { category: 'SERVER', make: 'Dell', model: 'PowerEdge R740', processorModel: 'Intel Xeon Silver 4214', ramGb: 64, storageGb: 2000, storageType: 'SSD', currentOs: 'Windows Server 2022', win11Compatible: 'UNKNOWN', purchaseDate: new Date('2021-02-15'), purchaseCostUsd: 5500, condition: 'OPERATIONAL', department: 'IT', location: 'Server Room A' },
    { category: 'PRINTER', make: 'HP', model: 'LaserJet Pro M404dn', purchaseDate: new Date('2023-05-10'), purchaseCostUsd: 350, condition: 'OPERATIONAL', department: 'Admin', location: 'Main Office' },
    { category: 'DESKTOP', make: 'HP', model: 'EliteDesk 800 G3', processorModel: 'Intel Core i7-6700', ramGb: 16, storageGb: 512, storageType: 'SSD', currentOs: 'Windows 10 Pro', win11Compatible: 'NO', tpmVersion: '1.2', purchaseDate: new Date('2017-11-01'), purchaseCostUsd: 900, condition: 'NEEDS_REPAIR', department: 'HR' },
  ];

  for (const hw of hardware) {
    await prisma.hardwareAsset.create({ data: { surveyId: survey.id, ...hw } });
  }

  // Sample software licenses
  await prisma.softwareLicense.createMany({
    data: [
      { surveyId: survey.id, softwareName: 'Adobe Acrobat Pro DC', vendor: 'Adobe', licenseType: 'SUBSCRIPTION', quantity: 5, assignedQty: 4, annualCostUsd: 899.40, expiryDate: new Date('2027-01-31') },
      { surveyId: survey.id, softwareName: 'AutoCAD 2024', vendor: 'Autodesk', licenseType: 'SUBSCRIPTION', quantity: 2, assignedQty: 2, annualCostUsd: 1975, expiryDate: new Date('2026-12-31') },
      { surveyId: survey.id, softwareName: 'Kaspersky Endpoint Security', vendor: 'Kaspersky', licenseType: 'SUBSCRIPTION', quantity: 30, assignedQty: 25, annualCostUsd: 1200, expiryDate: new Date('2026-08-15') },
    ],
  });

  // Sample information systems
  await prisma.informationSystem.createMany({
    data: [
      { surveyId: survey.id, systemName: 'ERA Licensing System', systemType: 'CUSTOM_WEB', vendor: 'In-house', version: '2.1', hostingType: 'ON_PREMISE', databaseEngine: 'PostgreSQL', primaryLanguage: 'PHP', userCount: 45, criticality: 'CRITICAL', dataClassification: 'CONFIDENTIAL', backupFrequency: 'DAILY' },
      { surveyId: survey.id, systemName: 'Financial Management System', systemType: 'ERP', vendor: 'SAP', hostingType: 'CLOUD', userCount: 15, criticality: 'HIGH', dataClassification: 'CONFIDENTIAL', backupFrequency: 'DAILY' },
      { surveyId: survey.id, systemName: 'Document Management', systemType: 'COLLABORATION', vendor: 'SharePoint', hostingType: 'SAAS', userCount: 50, criticality: 'MEDIUM', dataClassification: 'INTERNAL', backupFrequency: 'DAILY' },
    ],
  });

  // M365 user-device mappings
  await prisma.m365UserDeviceMap.createMany({
    data: [
      { organizationId: era.id, userEmail: 'it@era.gov.mv', userName: 'Ahmed Rasheed', department: 'IT', m365License: 'Microsoft 365 E3', deviceDescription: 'Dell Latitude 5530' },
      { organizationId: era.id, userEmail: 'admin@era.gov.mv', userName: 'Fathimath Nazla', department: 'Management', m365License: 'Microsoft 365 E3', deviceDescription: 'Lenovo ThinkPad T14s' },
      { organizationId: era.id, userEmail: 'finance@era.gov.mv', userName: 'Aishath Noor', department: 'Finance', m365License: 'Microsoft 365 Business Basic', deviceDescription: 'HP ProDesk 400 G7' },
      { organizationId: era.id, userEmail: 'legal@era.gov.mv', userName: 'Hassan Ali', department: 'Legal', m365License: 'Microsoft 365 E3', deviceDescription: 'Dell OptiPlex 3050' },
    ],
  });

  console.log('✅ Seed complete!');
  console.log('');
  console.log('Test accounts:');
  console.log('  IT Officer:  it@era.gov.mv / password123');
  console.log('  Admin:       admin@era.gov.mv / password123');
  console.log('  MDS Admin:   admin@digital.gov.mv / password123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
