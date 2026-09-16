import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/api-auth';
import { getReportData, ReportDateRangeError } from '@/lib/report-data';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    return NextResponse.json(await getReportData(searchParams.get('from'), searchParams.get('to')));
  } catch (error) {
    if (error instanceof ReportDateRangeError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Failed to fetch report:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
