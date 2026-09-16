import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

const recipientSchema = z.object({
  email: z.string().trim().email('Enter a valid email address').max(320),
  label: z.string().trim().min(1, 'Name or label is required').max(100),
});

export async function GET() {
  if (!getAdminSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const recipients = await prisma.reportRecipient.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(recipients);
  } catch (error) {
    console.error('Failed to fetch report recipients:', error);
    return NextResponse.json({ error: 'Failed to fetch report recipients' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const input = recipientSchema.parse(await req.json());
    const recipient = await prisma.reportRecipient.create({
      data: {
        email: input.email.toLowerCase(),
        label: input.label,
      },
    });
    return NextResponse.json(recipient, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'That email address is already on the list.' }, { status: 409 });
    }
    console.error('Failed to create report recipient:', error);
    return NextResponse.json({ error: 'Failed to add report recipient' }, { status: 500 });
  }
}
