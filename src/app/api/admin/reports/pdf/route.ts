import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/api-auth';
import { getReportData, ReportDateRangeError } from '@/lib/report-data';
import { renderReportPdf } from '@/lib/report-pdf';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Streams a report PDF generated from server-side report data only. */
export async function GET(req: Request) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const report = await getReportData(searchParams.get('from'), searchParams.get('to'));
    const pdf = await renderReportPdf(report);
    const filename = `suthra-punjab-report-${report.from}-to-${report.to}.pdf`;

    // React PDF returns a Node Buffer. Convert it to a Web-compatible byte view
    // for the App Router response body without writing a temporary file.
    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store, max-age=0',
      },
    });
  } catch (error) {
    if (error instanceof ReportDateRangeError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Failed to generate report PDF:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
