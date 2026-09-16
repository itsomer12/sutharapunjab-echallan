import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  ReportEmailConfigurationError,
  ReportEmailDeliveryError,
  sendReportForDateRange,
} from '@/lib/report-email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PAKISTAN_TIME_ZONE = 'Asia/Karachi';

function pakistanCalendarDate(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PAKISTAN_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

/** Returns yesterday's calendar date in Pakistan Standard Time (UTC+5, no DST). */
function yesterdayInPakistan(now = new Date()) {
  const today = pakistanCalendarDate(now);
  const yesterday = new Date(`${today}T00:00:00.000Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return yesterday.toISOString().slice(0, 10);
}

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  const token = request.headers.get('authorization');
  if (!secret || !token) return false;

  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(token);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/**
 * Invoked daily by Vercel Cron at 2:00 AM UTC (7:00 AM PKT) to send the
 * previous Pakistan calendar day's report to all active report recipients.
 * Vercel's Hobby plan only guarantees an invocation sometime within that UTC
 * hour; it does not guarantee execution precisely at 2:00 AM UTC.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const yesterday = yesterdayInPakistan();

  try {
    const result = await sendReportForDateRange(yesterday, yesterday);
    return NextResponse.json({
      message: `Daily report sent for ${yesterday}.`,
      recipientCount: result.recipientCount,
      from: yesterday,
      to: yesterday,
    });
  } catch (error) {
    if (error instanceof ReportEmailConfigurationError) {
      console.error('Daily report cron is missing email configuration:', error);
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (error instanceof ReportEmailDeliveryError) {
      console.error('Daily report cron delivery failed:', error);
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    console.error('Daily report cron failed:', error);
    return NextResponse.json({ error: 'Failed to send daily report.' }, { status: 500 });
  }
}
