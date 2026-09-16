'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Download, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ReportRecipients from './ReportRecipients';
import { CardSkeleton, LoadingOverlay, useDashboardLoading, useSmoothLoading } from '@/components/DashboardLoading';

interface CountItem {
  name: string;
  count: number;
}

interface DailyItem {
  date: string;
  count: number;
}

interface InspectorItem {
  rank: number;
  name: string;
  staffId: string;
  count: number;
}

interface ReportData {
  from: string;
  to: string;
  totalCount: number;
  categoryData: CountItem[];
  townData: CountItem[];
  dailyData: DailyItem[];
  inspectorData: InspectorItem[];
}

function todayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function reportRange(from: string, to: string) {
  const fromLabel = format(parseISO(from), 'dd MMM yyyy');
  const toLabel = format(parseISO(to), 'dd MMM yyyy');
  return from === to ? fromLabel : `${fromLabel} – ${toLabel}`;
}

function ReportPanel({
  title,
  subtitle,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-md border border-border bg-surface-card ${className}`}>
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-section text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-caption text-ink-secondary">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function EmptyState() {
  return <p className="px-5 py-8 text-center text-body text-ink-secondary">No challans in this date range.</p>;
}

export default function ReportsClient() {
  const initialDate = todayString();
  const [from, setFrom] = useState(initialDate);
  const [to, setTo] = useState(initialDate);
  const [appliedRange, setAppliedRange] = useState({ from: initialDate, to: initialDate });
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [sendStatus, setSendStatus] = useState<string | null>(null);
  const { track } = useDashboardLoading();
  const reportLoading = useSmoothLoading(loading);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(appliedRange);
      const response = await track(() => fetch(`/api/admin/reports?${params.toString()}`));
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to load the report.');
      setData(payload);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Unable to load the report.');
    } finally {
      setLoading(false);
    }
  }, [appliedRange, track]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  function applyRange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (from > to) {
      setError('The from date must be on or before the to date.');
      return;
    }
    setAppliedRange({ from, to });
  }

  async function sendTestReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSendingTest(true);
    setSendStatus(null);
    try {
      const response = await track(() => fetch('/api/admin/reports/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...appliedRange, email: testEmail }),
      }));
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to send the test report.');
      setSendStatus(payload.message);
    } catch (err) {
      setSendStatus(err instanceof Error ? err.message : 'Unable to send the test report.');
    } finally {
      setSendingTest(false);
    }
  }

  const maxDailyCount = Math.max(...(data?.dailyData.map((item) => item.count) || [0]), 1);
  const townsWithChallans = data?.townData.filter((item) => item.count > 0).length || 0;

  return (
    <div className="mx-auto max-w-[960px] space-y-6 pb-16 md:pb-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-page-title text-ink">Reports</h1>
          <p className="mt-1 text-body text-ink-secondary">
            A management summary based on challan date.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {data && <p className="text-caption text-ink-tertiary">Reporting period: {reportRange(data.from, data.to)}</p>}
          <Button asChild variant="outline" size="sm">
            <a href={`/api/admin/reports/pdf?${new URLSearchParams(appliedRange).toString()}`}>
              <Download aria-hidden="true" />
              Download PDF
            </a>
          </Button>
        </div>
      </div>

      <form onSubmit={applyRange} className="rounded-md border border-border bg-surface-inset p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1 text-caption font-medium text-ink-secondary">
            From
            <Input
              type="date"
              value={from}
              max={to}
              onChange={(event) => setFrom(event.target.value)}
              className="mt-1 bg-surface-page"
              aria-label="Report from date"
            />
          </label>
          <label className="block flex-1 text-caption font-medium text-ink-secondary">
            To
            <Input
              type="date"
              value={to}
              min={from}
              onChange={(event) => setTo(event.target.value)}
              className="mt-1 bg-surface-page"
              aria-label="Report to date"
            />
          </label>
          <Button type="submit" disabled={loading} className="shrink-0">Update report</Button>
        </div>
      </form>

      <form onSubmit={sendTestReport} className="rounded-md border border-border bg-surface-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1 text-caption font-medium text-ink-secondary">
            Your email address
            <Input
              type="email"
              required
              value={testEmail}
              onChange={(event) => setTestEmail(event.target.value)}
              className="mt-1 bg-surface-page"
              placeholder="you@example.gov.pk"
            />
          </label>
          <Button type="submit" disabled={sendingTest} className="shrink-0">
            {sendingTest ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
            Send test report now
          </Button>
        </div>
        <p className="mt-2 text-caption text-ink-secondary">
          Sends one PDF report for the selected period to this address only; the mailing list is not used.
        </p>
        {sendStatus && (
          <p className={`mt-3 text-body ${sendStatus.startsWith('Test report sent') ? 'text-primary' : 'text-danger-text'}`} role="status">
            {sendStatus}
          </p>
        )}
      </form>

      <ReportRecipients />

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-sm border border-danger/20 bg-danger-subtle px-4 py-3 text-body text-danger-text" role="alert">
          <span>{error}</span>
          <Button type="button" variant="ghost" size="sm" onClick={fetchReport} className="text-danger-text hover:bg-danger/10 hover:text-danger">
            Retry
          </Button>
        </div>
      )}

      {loading && !data ? (
        <CardSkeleton className="h-64" />
      ) : data ? (
        <div className="relative" aria-busy={loading}>
          <LoadingOverlay show={reportLoading} label="Updating report" />
          <div className="grid grid-cols-2 gap-5 border-b border-border pb-6 sm:grid-cols-4">
            <div>
              <p className="text-caption text-ink-secondary">Total challans</p>
              <p className="mt-1 text-[1.75rem] font-semibold leading-none tabular-nums text-ink">{data.totalCount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-caption text-ink-secondary">Categories recorded</p>
              <p className="mt-1 text-[1.75rem] font-semibold leading-none tabular-nums text-ink">{data.categoryData.length}</p>
            </div>
            <div>
              <p className="text-caption text-ink-secondary">Towns represented</p>
              <p className="mt-1 text-[1.75rem] font-semibold leading-none tabular-nums text-ink">{townsWithChallans}</p>
            </div>
            <div>
              <p className="text-caption text-ink-secondary">Inspectors active</p>
              <p className="mt-1 text-[1.75rem] font-semibold leading-none tabular-nums text-ink">{data.inspectorData.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ReportPanel title="Violation categories" subtitle="Challans by recorded category">
              {data.categoryData.length === 0 ? <EmptyState /> : (
                <div className="divide-y divide-border">
                  {data.categoryData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between gap-4 px-5 py-3 text-table-cell">
                      <span className="text-ink">{item.name}</span>
                      <span className="shrink-0 font-semibold tabular-nums text-ink">{item.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </ReportPanel>

            <ReportPanel title="By town" subtitle="Town or tehsil recorded on each challan">
              <div className="divide-y divide-border">
                {data.townData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-4 px-5 py-3 text-table-cell">
                    <span className={item.count ? 'text-ink' : 'text-ink-secondary'}>{item.name}</span>
                    <span className="shrink-0 font-semibold tabular-nums text-ink">{item.count}</span>
                  </div>
                ))}
              </div>
            </ReportPanel>

            <ReportPanel title="Daily trend" subtitle="Challans recorded each day" className="lg:col-span-2">
              <div className="divide-y divide-border">
                {data.dailyData.map((item) => (
                  <div key={item.date} className="grid grid-cols-[112px_1fr_auto] items-center gap-4 px-5 py-3 text-table-cell sm:grid-cols-[140px_1fr_auto]">
                    <span className="tabular-nums text-ink-secondary">{format(parseISO(item.date), 'EEE, dd MMM')}</span>
                    <span className="h-1.5 overflow-hidden rounded-sm bg-surface-inset" aria-hidden="true">
                      <span className="block h-full rounded-sm bg-primary" style={{ width: `${(item.count / maxDailyCount) * 100}%` }} />
                    </span>
                    <span className="font-semibold tabular-nums text-ink">{item.count}</span>
                  </div>
                ))}
              </div>
            </ReportPanel>

            <ReportPanel title="Top inspectors" subtitle="Highest challan volume in this period" className="lg:col-span-2">
              {data.inspectorData.length === 0 ? <EmptyState /> : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left text-table-cell">
                    <thead className="bg-surface-inset text-table-head text-ink-secondary">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Rank</th>
                        <th className="px-5 py-3 font-semibold">Inspector</th>
                        <th className="px-5 py-3 font-semibold">Staff ID</th>
                        <th className="px-5 py-3 text-right font-semibold">Challans</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.inspectorData.map((item) => (
                        <tr key={`${item.staffId}-${item.name}`}>
                          <td className="px-5 py-3 tabular-nums text-ink-secondary">{item.rank}</td>
                          <td className="px-5 py-3 font-medium text-ink">{item.name}</td>
                          <td className="px-5 py-3 tabular-nums text-ink-secondary">{item.staffId}</td>
                          <td className="px-5 py-3 text-right font-semibold tabular-nums text-ink">{item.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ReportPanel>
          </div>
        </div>
      ) : null}
    </div>
  );
}
