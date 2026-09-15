import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BarChart3, FileStack } from 'lucide-react';

export default async function AdminPage() {
  const token = cookies().get('token')?.value;
  if (!token) redirect('/login');
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'ADMIN') redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { name: true },
  });

  const [totalChallans, totalInspectors, activeInspectors] = await Promise.all([
    prisma.challan.count(),
    prisma.user.count({ where: { role: 'INSPECTOR' } }),
    prisma.user.count({ where: { role: 'INSPECTOR', status: 'ACTIVE' } }),
  ]);

  const stats = [
    { label: 'Total Challans', value: totalChallans.toLocaleString() },
    { label: 'Total Inspectors', value: totalInspectors.toLocaleString() },
    { label: 'Active Inspectors', value: activeInspectors.toLocaleString() },
  ];

  return (
    <div className="max-w-[960px] mx-auto pb-16 md:pb-0">
      <div className="mb-8">
        <h1 className="text-page-title text-ink">Dashboard</h1>
        <p className="text-body text-ink-secondary mt-1">
          Welcome back{user?.name ? `, ${user.name}` : ''}.
        </p>
      </div>

      {/* Bare stat figures — label above, number below, rule separator (no cards) */}
      <div className="grid grid-cols-3 gap-6 mb-8 pb-8 border-b border-border">
        {stats.map((stat) => (
          <div key={stat.label}>
            <p className="text-caption text-ink-secondary">{stat.label}</p>
            <p className="mt-1 text-[1.75rem] font-semibold leading-none text-ink tabular-nums">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/admin/entries"
          className="flex gap-3 rounded-md border border-border bg-surface-card p-5 transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-[0_4px_10px_rgba(28,25,23,0.10)] focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:shadow-[0_4px_10px_rgba(28,25,23,0.10)]"
        >
          <FileStack className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h2 className="text-section text-ink">All Challans</h2>
            <p className="mt-1 text-caption text-ink-secondary">
              Search, filter, and view all issued e-challans.
            </p>
          </div>
        </Link>
        <Link
          href="/admin/analytics"
          className="flex gap-3 rounded-md border border-border bg-surface-card p-5 transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-[0_4px_10px_rgba(28,25,23,0.10)] focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:shadow-[0_4px_10px_rgba(28,25,23,0.10)]"
        >
          <BarChart3 className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h2 className="text-section text-ink">Analytics</h2>
            <p className="mt-1 text-caption text-ink-secondary">
              View charts and trends for violation data.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
