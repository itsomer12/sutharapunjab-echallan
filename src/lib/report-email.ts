import { prisma } from '@/lib/db';
import { getReportData, type ReportData } from '@/lib/report-data';
import { renderReportPdf } from '@/lib/report-pdf';

type EmailRecipient = {
  email: string;
  label?: string;
};

export type ReportEmailResult = {
  recipientCount: number;
  report: ReportData;
};

export class ReportEmailConfigurationError extends Error {}
export class ReportEmailDeliveryError extends Error {}

function reportSummary(report: ReportData) {
  const period = report.from === report.to ? report.from : `${report.from} to ${report.to}`;
  const mostCommon = report.categoryData[0];
  const totalLabel = `${report.totalCount.toLocaleString('en-GB')} ${report.totalCount === 1 ? 'challan' : 'challans'}`;

  if (!mostCommon) {
    return `For ${period}, this report covers ${totalLabel}; no violation category was recorded.`;
  }

  const categoryCount = `${mostCommon.count.toLocaleString('en-GB')} ${mostCommon.count === 1 ? 'challan' : 'challans'}`;
  return `For ${period}, this report covers ${totalLabel}; the most common violation was ${mostCommon.name} (${categoryCount}).`;
}

function resendMessage(errorPayload: unknown) {
  if (
    typeof errorPayload === 'object'
    && errorPayload !== null
    && 'message' in errorPayload
    && typeof errorPayload.message === 'string'
  ) {
    return errorPayload.message;
  }
  return 'Resend could not send the email.';
}

async function sendReportToRecipients(report: ReportData, recipients: EmailRecipient[]): Promise<ReportEmailResult> {
  if (recipients.length === 0) {
    return { recipientCount: 0, report };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new ReportEmailConfigurationError('RESEND_API_KEY is not configured.');
  }

  const from = process.env.RESEND_FROM_EMAIL || 'Suthra Punjab Reports <onboarding@resend.dev>';
  const pdf = await renderReportPdf(report);
  const filename = `suthra-punjab-report-${report.from}-to-${report.to}.pdf`;
  const subject = `Suthra Punjab management report: ${report.from} to ${report.to}`;
  const text = reportSummary(report);

  const deliveries = await Promise.allSettled(recipients.map(async (recipient) => {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [recipient.email],
        subject,
        text,
        attachments: [{
          filename,
          content: pdf.toString('base64'),
          content_type: 'application/pdf',
        }],
      }),
    });

    if (!response.ok) {
      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        // Keep a provider response parsing failure from hiding the delivery error.
      }
      throw new Error(resendMessage(payload));
    }
  }));

  const failures = deliveries.filter((delivery): delivery is PromiseRejectedResult => delivery.status === 'rejected');
  if (failures.length > 0) {
    const firstFailure = failures[0].reason;
    const detail = firstFailure instanceof Error ? firstFailure.message : 'Resend could not send the email.';
    throw new ReportEmailDeliveryError(
      failures.length === recipients.length
        ? `Report email was not sent: ${detail}`
        : `Report email was sent to ${recipients.length - failures.length} recipient(s), but ${failures.length} delivery(ies) failed: ${detail}`
    );
  }

  return { recipientCount: recipients.length, report };
}

/**
 * Generates a management report for the inclusive date range and sends one
 * copy to every active report recipient. This is the schedule-ready entry point.
 */
export async function sendReportForDateRange(from?: string | null, to?: string | null) {
  const [report, recipients] = await Promise.all([
    getReportData(from, to),
    prisma.reportRecipient.findMany({
      where: { active: true },
      select: { email: true, label: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  return sendReportToRecipients(report, recipients);
}

/** Sends the same generated report to one address without using the mailing list. */
export async function sendTestReportForDateRange(from: string | null | undefined, to: string | null | undefined, email: string) {
  const report = await getReportData(from, to);
  return sendReportToRecipients(report, [{ email }]);
}
