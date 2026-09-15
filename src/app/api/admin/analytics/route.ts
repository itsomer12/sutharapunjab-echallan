import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { TOWNS } from '@/lib/constants';
import { getAdminSession } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!getAdminSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const [
      byCategory,
      dailyRaw,
      topInspectors,
      totalCount,
    ] = await Promise.all([
      // 1. Challan count by violation category
      prisma.challan.groupBy({
        by: ['violationDescription'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),

      // 2. Challans over last 30 days (we group in JS for portability)
      prisma.challan.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),

      // 3. Top inspectors
      prisma.challan.groupBy({
        by: ['inspectorName', 'inspectorId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

      // Total challan count
      prisma.challan.count(),
    ]);

    // Format category data
    const categoryData = byCategory.map((item) => ({
      name: item.violationDescription,
      count: item._count.id,
    }));

    // Format town data ensuring all 9 towns are present
    // Count challans where challan.town OR challan.tehsil matches each town name
    const townData = await Promise.all(
      TOWNS.map(async (townName) => {
        const count = await prisma.challan.count({
          where: {
            OR: [
              { town: { equals: townName, mode: 'insensitive' } },
              { tehsil: { equals: townName, mode: 'insensitive' } },
            ],
          },
        });
        return { name: townName, count };
      })
    );

    // Build daily series for full 30 days (fill gaps with 0)
    const dailyMap = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0]; // YYYY-MM-DD
      dailyMap.set(key, 0);
    }
    // Also include today if not already
    const todayKey = new Date().toISOString().split('T')[0];
    if (!dailyMap.has(todayKey)) {
      dailyMap.set(todayKey, 0);
    }

    for (const row of dailyRaw) {
      const key = new Date(row.createdAt).toISOString().split('T')[0];
      dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
    }

    const dailyData = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    // Format top inspectors
    const inspectorData = topInspectors.map((item, index) => ({
      rank: index + 1,
      name: item.inspectorName,
      staffId: item.inspectorId,
      count: item._count.id,
    }));

    return NextResponse.json({
      categoryData,
      townData,
      dailyData,
      inspectorData,
      totalCount,
    });
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
