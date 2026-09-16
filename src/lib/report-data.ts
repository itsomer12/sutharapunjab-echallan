import { prisma } from '@/lib/db';
import { TOWNS } from '@/lib/constants';

export interface CountItem {
  name: string;
  count: number;
}

export interface DailyItem {
  date: string;
  count: number;
}

export interface InspectorItem {
  rank: number;
  name: string;
  staffId: string;
  count: number;
}

export interface ReportData {
  from: string;
  to: string;
  totalCount: number;
  categoryData: CountItem[];
  townData: CountItem[];
  dailyData: DailyItem[];
  inspectorData: InspectorItem[];
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class ReportDateRangeError extends Error {}

export function todayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateAtStartOfDay(value: string) {
  if (!DATE_PATTERN.test(value)) return null;

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Returns the same report data used by both the admin screen and the PDF export.
 * The range is based on the violation's recorded datetime, inclusive of both days.
 */
export async function getReportData(fromInput?: string | null, toInput?: string | null): Promise<ReportData> {
  const from = fromInput || todayString();
  const to = toInput || from;
  const fromDate = dateAtStartOfDay(from);
  const toDate = dateAtStartOfDay(to);

  if (!fromDate || !toDate || fromDate > toDate) {
    throw new ReportDateRangeError('Choose a valid date range.');
  }

  const endOfToDate = new Date(toDate);
  endOfToDate.setHours(23, 59, 59, 999);
  const dateRange = { datetime: { gte: fromDate, lte: endOfToDate } };

  const [byCategory, dailyRaw, topInspectors, totalCount, townData] = await Promise.all([
    prisma.challan.groupBy({
      by: ['violationDescription'],
      where: dateRange,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
    prisma.challan.findMany({
      where: dateRange,
      select: { datetime: true },
      orderBy: { datetime: 'asc' },
    }),
    prisma.challan.groupBy({
      by: ['inspectorName', 'inspectorId'],
      where: dateRange,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
    prisma.challan.count({ where: dateRange }),
    Promise.all(
      TOWNS.map(async (townName) => ({
        name: townName,
        count: await prisma.challan.count({
          where: {
            AND: [
              dateRange,
              {
                OR: [
                  { town: { equals: townName, mode: 'insensitive' } },
                  { tehsil: { equals: townName, mode: 'insensitive' } },
                ],
              },
            ],
          },
        }),
      }))
    ),
  ]);

  const dailyMap = new Map<string, number>();
  const cursor = new Date(fromDate);
  while (cursor <= toDate) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, '0');
    const day = String(cursor.getDate()).padStart(2, '0');
    dailyMap.set(`${year}-${month}-${day}`, 0);
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const row of dailyRaw) {
    const date = new Date(row.datetime);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
  }

  return {
    from,
    to,
    totalCount,
    categoryData: byCategory.map((item) => ({
      name: item.violationDescription,
      count: item._count.id,
    })),
    townData,
    dailyData: Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count })),
    inspectorData: topInspectors.map((item, index) => ({
      rank: index + 1,
      name: item.inspectorName,
      staffId: item.inspectorId,
      count: item._count.id,
    })),
  };
}
