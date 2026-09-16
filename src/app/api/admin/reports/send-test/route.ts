import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminSession } from '@/lib/api-auth';
import {
  ReportEmailConfigurationError,
  ReportEmailDeliveryError,
  sendTestReportForDateRange,
} from '@/lib/report-email';
import { ReportDateRangeError } from '@/lib/report-data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const sendTestSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  email: z.string().trim().email('Enter a valid test email address').max(320),
});

/** Sends exactly one copy to the supplied address; it never sends the mailing list. */
export async function POST(req: Request) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const input = sendTestSchema.parse(await req.json());
    const result = await sendTestReportForDateRange(input.from, input.to, input.email.toLowerCase());
    return NextResponse.json({
      message: `Test report sent to ${input.email.toLowerCase()}.`,
      recipientCount: result.recipientCount,
    });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof ReportDateRangeError) {
      return NextResponse.json({ error: error instanceof z.ZodError ? error.errors[0].message : error.message }, { status: 400 });
    }
    if (error instanceof ReportEmailConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (error instanceof ReportEmailDeliveryError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    console.error('Failed to send test report:', error);
    return NextResponse.json({ error: 'Failed to send test report.' }, { status: 500 });
  }
}
