import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/api-auth';

const activeSchema = z.object({ active: z.boolean() });

async function recipientId(params: Promise<{ id: string }>) {
  const { id: value } = await params;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = await recipientId(params);
  if (!id) return NextResponse.json({ error: 'Invalid recipient ID' }, { status: 400 });

  try {
    const { active } = activeSchema.parse(await req.json());
    const recipient = await prisma.reportRecipient.update({
      where: { id },
      data: { active },
    });
    return NextResponse.json(recipient);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }
    console.error('Failed to update report recipient:', error);
    return NextResponse.json({ error: 'Failed to update report recipient' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = await recipientId(params);
  if (!id) return NextResponse.json({ error: 'Invalid recipient ID' }, { status: 400 });

  try {
    await prisma.reportRecipient.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }
    console.error('Failed to delete report recipient:', error);
    return NextResponse.json({ error: 'Failed to remove report recipient' }, { status: 500 });
  }
}
