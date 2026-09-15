import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { getAdminSession } from '@/lib/api-auth';

const updateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  cnic: z.string().regex(/^\d{5}-\d{7}-\d$/, 'CNIC must follow format 00000-0000000-0'),
  contactNo: z.string().min(10, 'Contact number is required'),
  town: z.string().min(1, 'Town is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().optional(),
  staffId: z.string().min(1, 'Staff ID is required'),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

const statusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

// PUT — full update of inspector fields
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await req.json();
    const data = updateSchema.parse(body);

    // Check uniqueness of username and staffId against other users
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: data.username },
          { staffId: data.staffId },
        ],
        NOT: { id },
      },
    });

    if (existingUser) {
      if (existingUser.username === data.username) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Staff ID already exists' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      name: data.name,
      cnic: data.cnic,
      contactNo: data.contactNo,
      town: data.town,
      username: data.username,
      staffId: data.staffId,
    };

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    if (data.password && data.password.trim() !== '') {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH — lightweight status toggle
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await req.json();
    const { status } = statusSchema.parse(body);

    await prisma.user.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Failed to toggle status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
