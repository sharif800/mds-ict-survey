import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canUploadAttachment, isCentral } from '@/lib/roles';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'image/png',
  'image/jpeg',
];

// POST: Upload attachment to a survey
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  if (!canUploadAttachment(user.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const { id: surveyId } = await params;

  // Verify survey exists and user has access
  const survey = await prisma.ictSurvey.findUnique({ where: { id: surveyId } });
  if (!survey) return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
  if (!isCentral(user.role) && survey.organizationId !== user.organizationId) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File;
  const category = (formData.get('category') as string) || 'OTHER';

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'File too large (max 25MB)' }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 400 });
  }

  // Create uploads directory
  const surveyDir = path.join(UPLOAD_DIR, surveyId);
  await mkdir(surveyDir, { recursive: true });

  // Generate unique filename
  const ext = path.extname(file.name);
  const storedName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const filePath = path.join(surveyDir, storedName);

  // Write file
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  // Save record
  const attachment = await prisma.surveyAttachment.create({
    data: {
      surveyId,
      category,
      storedName,
      originalName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      uploadedById: user.id,
    },
  });

  return NextResponse.json(attachment, { status: 201 });
}

// GET: List attachments for a survey
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  const { id: surveyId } = await params;

  const survey = await prisma.ictSurvey.findUnique({ where: { id: surveyId } });
  if (!survey) return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
  if (!isCentral(user.role) && survey.organizationId !== user.organizationId) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const attachments = await prisma.surveyAttachment.findMany({
    where: { surveyId },
    orderBy: { uploadedAt: 'desc' },
  });

  return NextResponse.json(attachments);
}
