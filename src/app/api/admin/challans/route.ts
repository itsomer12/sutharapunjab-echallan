import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '../../../../../prisma/generated/client/client';
import { getAdminSession } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const search = searchParams.get('search') || '';
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const town = searchParams.get('town');
    const category = searchParams.get('category');

    const skip = (page - 1) * limit;

    const whereClause: Prisma.ChallanWhereInput = {};

    if (search) {
      whereClause.OR = [
        { noticeNo: { contains: search, mode: 'insensitive' } },
        { citizenName: { contains: search, mode: 'insensitive' } },
        { citizenCnic: { contains: search, mode: 'insensitive' } },
        { citizenPhone: { contains: search, mode: 'insensitive' } },
        { inspectorName: { contains: search, mode: 'insensitive' } },
        { inspectorId: { contains: search, mode: 'insensitive' } },
        { createdByUser: { cnic: { contains: search, mode: 'insensitive' } } },
        { createdByUser: { contactNo: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (from || to) {
      whereClause.datetime = {};
      if (from) whereClause.datetime.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        whereClause.datetime.lte = toDate;
      }
    }

    if (town) {
      whereClause.OR = [
        ...(whereClause.OR || []),
        { town: { equals: town, mode: 'insensitive' } },
        { tehsil: { equals: town, mode: 'insensitive' } },
      ];
    }

    if (category) {
      whereClause.violationDescription = category;
    }

    const [data, total, distinctTownsResult] = await Promise.all([
      prisma.challan.findMany({
        where: whereClause,
        include: { createdByUser: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.challan.count({ where: whereClause }),
      prisma.challan.findMany({
        distinct: ['town'],
        select: { town: true },
      })
    ]);

    const uniqueTowns = distinctTownsResult.map(t => t.town).filter(Boolean);

    return NextResponse.json({
      data,
      total,
      uniqueTowns,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Failed to fetch challans:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
