import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { getNextNoticeNumber } from '@/lib/notice-number';
import { cookies } from 'next/headers';
import { z } from 'zod';

const challanSchema = z.object({
  datetime: z.string(),
  location: z.string().min(1, 'Location is required'),
  uc: z.string().min(1, 'UC is required'),
  zone: z.string().min(1, 'Zone is required'),
  tehsil: z.string().min(1, 'Tehsil is required'),
  district: z.string().min(1, 'District is required'),
  name: z.string().min(1, 'Citizen name is required'),
  cnic: z.string().regex(/^\d{5}-\d{7}-\d$/, 'CNIC must follow format 00000-0000000-0').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  violation_description: z.string().min(1, 'Violation is required'),
  warning_count: z.string().transform(v => parseInt(v, 10)).or(z.number()),
  violationImageUrl: z.string().url().optional(),
});

export async function POST(req: Request) {
  try {
    const token = cookies().get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'INSPECTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the current user details for the challan
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { name: true, staffId: true, town: true },
    });

    if (!user || !user.town) {
      return NextResponse.json({ error: 'User setup incomplete' }, { status: 400 });
    }
    const town = user.town;

    const body = await req.json();
    const data = challanSchema.parse(body);

    // Keep the counter increment and insert in one transaction: a failed insert
    // rolls back the increment, so a notice number is only consumed on save.
    const challan = await prisma.$transaction(async (tx) => {
      const noticeNo = await getNextNoticeNumber(tx);

      return tx.challan.create({
        data: {
          noticeNo,
          createdByUserId: payload.userId,
          inspectorName: user.name,
          inspectorId: user.staffId,
          town,
          datetime: new Date(data.datetime),
          location: data.location,
          uc: data.uc,
          zone: data.zone,
          tehsil: data.tehsil,
          district: data.district,
          citizenName: data.name,
          citizenCnic: data.cnic || '',
          citizenPhone: data.phone || '',
          citizenAddress: data.address,
          violationDescription: data.violation_description,
          warningCount: Number(data.warning_count),
          violationImageUrl: data.violationImageUrl || null,
        },
      });
    });

    return NextResponse.json(challan, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Failed to create challan:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
