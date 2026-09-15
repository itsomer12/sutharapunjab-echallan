import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { getAdminSession } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  cnic: z.string().regex(/^\d{5}-\d{7}-\d$/, 'CNIC must follow format 00000-0000000-0'),
  contactNo: z.string().min(10, 'Contact number is required'),
  town: z.string().min(1, 'Town is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  staffId: z.string().min(1, 'Staff ID is required'),
});

export async function GET() {
  if (!getAdminSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      where: { role: 'INSPECTOR' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        cnic: true,
        contactNo: true,
        town: true,
        username: true,
        staffId: true,
        status: true,
        createdAt: true,
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = userSchema.parse(body);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: data.username },
          { staffId: data.staffId },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.username === data.username) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Staff ID already exists' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        cnic: data.cnic,
        contactNo: data.contactNo,
        town: data.town,
        username: data.username,
        staffId: data.staffId,
        passwordHash,
        role: 'INSPECTOR',
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({
      id: user.id,
      name: user.name,
      username: user.username,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Failed to create user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
