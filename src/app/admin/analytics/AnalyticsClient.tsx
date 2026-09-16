'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { CardSkeleton, LoadingOverlay, useDashboardLoading, useSmoothLoading } from '@/components/DashboardLoading';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CategoryItem {
  name: string;
  count: number;
}

interface TownItem {
  name: string;
  count: number;
}

interface DailyItem {
  date: string; // YYYY-MM-DD
  count: number;
}

interface InspectorItem {
  rank: number;
  name: string;
  staffId: string;
  count: number;
}

interface AnalyticsData {
  categoryData: CategoryItem[];
  townData: TownItem[];
  dailyData: DailyItem[];
  inspectorData: InspectorItem[];
  totalCount: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const POLL_INTERVAL = 20_000; // 20 seconds

// Restrained, muted palette using the new Stone scale
const PIE_COLORS = [
  '#44403C', // stone-700
  '#78716C', // stone-500
  '#A8A29E', // stone-400
  '#D6D3D1', // stone-300
  '#57534E', // stone-600
  '#292524', // stone-800
  '#E7E5E4', // stone-200
  '#1C1917', // stone-900
  '#F5F5F4', // stone-100
  '#78716C',
  '#44403C',
  '#A8A29E',
  '#57534E',
  '#D6D3D1',
  '#292524',
];

const ACCENT = 'hsl(var(--primary))'; // #1B7A4D — Decisions: chart bar/area fills

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Shorten long violation category names for chart labels */
function shorten(name: string, maxLen = 22): string {
  if (name.length <= maxLen) return name;
  return name.slice(0, maxLen - 1) + '…';
}

/* ------------------------------------------------------------------ */
/*  Custom Tooltip for Pie                                             */
/* ------------------------------------------------------------------ */

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: CategoryItem }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-surface-card border border-border rounded-md px-3 py-2 text-body text-ink">
      <p className="font-medium leading-snug">{d.payload.name}</p>
      <p className="text-ink-secondary mt-0.5">
        {d.value} challan{d.value !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Custom Tooltip for Bar/Area                                        */
/* ------------------------------------------------------------------ */

function ChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
}: {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
  label?: string;
  labelFormatter?: (l: string) => string;
}) {
  if (!active || !payload?.length) return null;
  const formatted = labelFormatter ? labelFormatter(label || '') : label;
  return (
    <div className="bg-surface-card border border-border rounded-md px-3 py-2 text-body text-ink">
      <p className="font-medium">{formatted}</p>
      <p className="text-ink-secondary mt-0.5">
        {payload[0].value} challan{payload[0].value !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chart card — bordered container, 6px radius, no shadow             */
/* ------------------------------------------------------------------ */

function DashCard({
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
    <div className={`bg-surface-card rounded-md border border-border p-5 ${className}`}>
      <div className="mb-4">
        <h2 className="text-section text-ink">{title}</h2>
        {subtitle && (
          <p className="text-caption text-ink-secondary mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const { track } = useDashboardLoading();
  const refreshing = useSmoothLoading(loading);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await track(() => fetch('/api/admin/analytics'));
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const json: AnalyticsData = await res.json();
      setData(json);
      setLastUpdated(new Date());
      setPollError(null);
    } catch (err) {
      console.error(err);
      setPollError('Failed to refresh data.');
    } finally {
      setLoading(false);
    }
  }, [track]);

  // Initial fetch
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Polling
  useEffect(() => {
    const id = setInterval(fetchAnalytics, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchAnalytics]);

  /* ---- Loading state ---- */
  if (loading && !data) {
    return (
      <CardSkeleton className="h-64" />
    );
  }

  if (!data) {
    return (
      <p className="text-ink-secondary text-center mt-12 text-body">
        Unable to load analytics data.
      </p>
    );
  }

  /* ---- Render ---- */
  return (
    <div className="space-y-6 pb-16 md:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-page-title text-ink">Analytics</h1>
          <p className="text-body text-ink-secondary mt-0.5">
            {data.totalCount.toLocaleString()} total challans issued
          </p>
        </div>
        {lastUpdated && (
          <div className="text-left sm:text-right mt-2 sm:mt-0">
            {pollError ? (
              <p className="text-caption text-danger-text font-medium">
                {pollError}
              </p>
            ) : (
              <p className="text-caption text-ink-tertiary">
                Last updated {format(lastUpdated, 'HH:mm:ss')} · refreshes every 20s
              </p>
            )}
          </div>
        )}
      </div>

      {/* Charts Grid — 2 cols on desktop, stacks on mobile */}
      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6" aria-busy={loading}>
        <LoadingOverlay show={refreshing} label="Refreshing analytics" />
        {/* 1 ─ Challan count over time (area chart, --primary fill) */}
        <DashCard
          title="Challans Over Time"
          subtitle="Last 30 days, daily"
          className="lg:col-span-2"
        >
          <div className="h-64 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.dailyData}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ACCENT} stopOpacity={0.12} />
                    <stop offset="100%" stopColor={ACCENT} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'hsl(var(--ink-tertiary))' }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickFormatter={(v: string) => format(parseISO(v), 'dd MMM')}
                  interval="preserveStartEnd"
                  minTickGap={40}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--ink-tertiary))' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={36}
                />
                <Tooltip
                  content={
                    <ChartTooltip
                      labelFormatter={(v) =>
                        format(parseISO(v), 'EEEE, dd MMM yyyy')
                      }
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke={ACCENT}
                  strokeWidth={2}
                  fill="url(#areaGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: ACCENT, stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </DashCard>

        {/* 2 ─ By Violation Category (pie — multi-gray, per Decisions) */}
        <DashCard title="By Violation Category">
          <div className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-4">
            <div className="h-72 lg:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius="70%"
                    innerRadius="40%"
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {data.categoryData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 lg:gap-x-4 lg:gap-y-2">
              {data.categoryData.map((category, i) => (
                <div key={category.name} className="flex min-w-0 items-center gap-2 text-caption">
                  <span
                    className="h-2 w-2 shrink-0 rounded-sm"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate text-ink" title={category.name}>
                    {shorten(category.name)}
                  </span>
                  <span className="shrink-0 tabular-nums text-ink-secondary">{category.count}</span>
                </div>
              ))}
            </div>
          </div>
        </DashCard>

        {/* 3 ─ By Town (bar chart — --primary fill) */}
        <DashCard title="By Town">
          <div className="h-80 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.townData}
                layout="vertical"
                margin={{ left: 4, right: 16, top: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: 'hsl(var(--ink-tertiary))' }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  allowDecimals={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11, fill: 'hsl(var(--ink-secondary))' }}
                  tickLine={false}
                  axisLine={false}
                  width={160}
                  tickFormatter={(v) => shorten(v, 22)}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="count"
                  fill={ACCENT}
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashCard>

        {/* 4 ─ Top Inspectors (ranked list) */}
        <DashCard
          title="Top Inspectors"
          subtitle="Ranked by challans issued"
          className="lg:col-span-2"
        >
          {data.inspectorData.length === 0 ? (
            <p className="text-body text-ink-secondary py-4 text-center">
              No data yet.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {data.inspectorData.map((insp) => (
                <div
                  key={`${insp.staffId}-${insp.name}`}
                  className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <span
                    className={`
                      flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-caption font-semibold
                      ${
                        insp.rank === 1
                          ? 'bg-ink text-primary-on'
                          : insp.rank === 2
                          ? 'bg-ink-secondary text-primary-on'
                          : insp.rank === 3
                          ? 'bg-border text-ink'
                          : 'bg-surface-inset text-ink-tertiary border border-border'
                      }
                    `}
                  >
                    {insp.rank}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-body font-medium text-ink truncate">
                      {insp.name}
                    </p>
                    <p className="text-caption text-ink-secondary">{insp.staffId}</p>
                  </div>

                  <span className="text-body font-semibold text-ink tabular-nums">
                    {insp.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DashCard>
      </div>
    </div>
  );
}
