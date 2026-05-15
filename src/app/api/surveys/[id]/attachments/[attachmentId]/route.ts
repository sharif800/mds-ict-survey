import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isCentral } from '@/lib/roles';
import { readFile } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// GET: Download/serve an attachment
export async function GET(req: Request, { params }: { params: Promise<{ id: string; attachmentId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  const { id: surveyId, attachmentId } = await params;

  const attachment = await prisma.surveyAttachment.findUnique({
    where: { id: attachmentId },
    include: { survey: true },
  });

  if (!attachment || attachment.surveyId !== surveyId) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
  }

  // RBAC: only same org or central can download
  if (!isCentral(user.role) && attachment.survey.organizationId !== user.organizationId) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const filePath = path.join(UPLOAD_DIR, surveyId, attachment.storedName);

  try {
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': attachment.mimeType,
        'Content-Disposition': `inline; filename="${attachment.originalName}"`,
        'Content-Length': String(attachment.sizeBytes),
      },
    });
  } catch {
    return NextResponse.json({ error: 'File not found on disk' }, { status: 404 });
  }
}

// DELETE: Remove an attachment
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; attachmentId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = session.user as any;
  const { id: surveyId, attachmentId } = await params;

  const attachment = await prisma.surveyAttachment.findUnique({
    where: { id: attachmentId },
    include: { survey: true },
  });

  if (!attachment || attachment.surveyId !== surveyId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Only uploader or central IT can delete
  if (attachment.uploadedById !== user.id && !isCentral(user.role)) {
    return NextResponse.json({ error: 'Only uploader or MDS admin can delete' }, { status: 403 });
  }

  await prisma.surveyAttachment.delete({ where: { id: attachmentId } });
  return NextResponse.json({ success: true });
}
