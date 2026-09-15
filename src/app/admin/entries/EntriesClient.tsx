'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, Search, FileText, Image as ImageIcon } from 'lucide-react';
import type { Challan } from '../../../../prisma/generated/client/client';
import { TOWNS } from '@/lib/constants';

const VIOLATION_CATEGORIES = [
  "Illegal Sewage or Drainage Discharge",
  "Prohibited Carcass Disposal",
  "Improper Offal and Animal Waste Disposal",
  "Public Littering and Waste Dumping",
  "Failure to Provide Premises Waste Disposal",
  "Uncleaned Premises Frontage",
  "Unmaintained Latrines, Urinals, or Drains",
  "Plastic and Non-Perishable Waste Accumulation",
  "Non-Compliance with Agency Directives",
  "Unlicensed Waste Collection or Sorting",
  "Environmental Pollution and Health Hazard",
  "Abetment or Attempt of Offense",
  "Solid Waste Burning",
  "Obstruction of Waste Management Officers",
  "Tyre Burning"
];

// Extend Challan to include the relation we fetch
type ChallanWithUser = Challan & { createdByUser: { contactNo: string; cnic: string } };

/* ---- Skeleton row for loading state ---- */
function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableCell key={i}>
          <div className="h-4 bg-surface-inset rounded-sm animate-pulse" style={{ width: `${60 + (i * 7) % 40}%` }} />
        </TableCell>
      ))}
    </TableRow>
  );
}

function MobileSkeletonCard() {
  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-between">
        <div className="h-4 w-20 bg-surface-inset rounded-sm animate-pulse" />
        <div className="h-3 w-28 bg-surface-inset rounded-sm animate-pulse" />
      </div>
      <div className="h-4 w-40 bg-surface-inset rounded-sm animate-pulse" />
      <div className="h-3 w-full bg-surface-inset rounded-sm animate-pulse" />
      <div className="flex justify-between">
        <div className="h-3 w-20 bg-surface-inset rounded-sm animate-pulse" />
        <div className="h-3 w-24 bg-surface-inset rounded-sm animate-pulse" />
      </div>
    </div>
  );
}

export default function EntriesClient() {
  const [data, setData] = useState<ChallanWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 25;

  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [town, setTown] = useState('all');
  const [category, setCategory] = useState('all');

  const [selectedChallan, setSelectedChallan] = useState<ChallanWithUser | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.append('search', search);
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      if (town && town !== 'all') params.append('town', town);
      if (category && category !== 'all') params.append('category', category);

      const res = await fetch(`/api/admin/challans?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch challan data. Please try again.');
      const result = await res.json();
      
      setData(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, from, to, town, category]);

  useEffect(() => {
    // Debounce the fetch slightly to avoid spamming on every keystroke
    const handler = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(handler);
  }, [fetchData]);

  return (
    <div className="space-y-4">
      {/* Filters — fully responsive */}
      <div className="flex flex-col gap-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            id="entries-search"
            placeholder="Search across all fields..."
            className="pl-8"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            aria-label="Search challans"
          />
        </div>

        {/* Date range + selects — wrap on mobile */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2 flex-1 min-w-0">
            <Input
              id="filter-from-date"
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setPage(1); }}
              className="flex-1 min-w-0"
              aria-label="From date"
            />
            <Input
              id="filter-to-date"
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); setPage(1); }}
              className="flex-1 min-w-0"
              aria-label="To date"
            />
          </div>
          <div className="flex gap-2 flex-1 min-w-0">
            <Select value={town} onValueChange={(v) => { setTown(v); setPage(1); }}>
              <SelectTrigger className="flex-1 min-w-0" aria-label="Filter by town">
                <SelectValue placeholder="All Towns" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Towns</SelectItem>
                {TOWNS.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
              <SelectTrigger className="flex-1 min-w-0" aria-label="Filter by violation category">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {VIOLATION_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-sm bg-danger-subtle border border-danger/20 px-4 py-3 text-body text-danger-text flex items-center justify-between" role="alert">
          <span>{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchData()}
            className="text-danger-text hover:text-danger hover:bg-danger/10 ml-3 shrink-0"
          >
            Retry
          </Button>
        </div>
      )}

      <div className="bg-surface-card rounded-md border border-border overflow-hidden">
        {/* Desktop Table — sentence-case headers */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-surface-inset">
              <TableRow>
                <TableHead className="font-semibold text-ink-secondary text-table-head normal-case tracking-normal">Notice No.</TableHead>
                <TableHead className="font-semibold text-ink-secondary text-table-head normal-case tracking-normal">Date/Time</TableHead>
                <TableHead className="font-semibold text-ink-secondary text-table-head normal-case tracking-normal">Town</TableHead>
                <TableHead className="font-semibold text-ink-secondary text-table-head normal-case tracking-normal">Citizen</TableHead>
                <TableHead className="font-semibold text-ink-secondary text-table-head normal-case tracking-normal">Inspector</TableHead>
                <TableHead className="font-semibold text-ink-secondary text-table-head normal-case tracking-normal">Violation</TableHead>
                <TableHead className="font-semibold text-ink-secondary text-table-head normal-case tracking-normal">Photo</TableHead>
                <TableHead className="font-semibold text-ink-secondary text-table-head normal-case tracking-normal">Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : data.length === 0 && !error ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-surface-inset rounded-full flex items-center justify-center">
                        <FileText className="w-5 h-5 text-ink-tertiary" aria-hidden="true" />
                      </div>
                      <p className="font-medium text-ink text-body">No entries yet</p>
                      <p className="text-ink-secondary text-caption">Challans issued by inspectors will appear here.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow
                    key={item.id}
                    className={`cursor-pointer hover:bg-surface-inset/50 ${
                      item.warningCount >= 3
                        ? '[box-shadow:inset_3px_0_0_hsl(var(--warning))]'
                        : ''
                    }`}
                    onClick={() => setSelectedChallan(item)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open challan ${item.noticeNo}`}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedChallan(item); } }}
                  >
                    <TableCell className="font-medium text-table-cell text-ink tabular-nums">
                      <span className="flex items-center gap-1.5">
                        {item.noticeNo}
                        {item.warningCount >= 3 && (
                          <span
                            className="inline-flex text-warning"
                            title={`High prior-warning count: ${item.warningCount}`}
                            aria-label={`High prior-warning count: ${item.warningCount}`}
                          >
                            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                          </span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-table-cell text-ink-secondary tabular-nums">{format(new Date(item.datetime), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell className="text-table-cell text-ink">{item.town}</TableCell>
                    <TableCell className="text-table-cell">
                      <div className="font-medium text-ink">{item.citizenName}</div>
                      <div className="text-caption text-ink-secondary">{item.citizenCnic}</div>
                    </TableCell>
                    <TableCell className="text-table-cell">
                      <div className="font-medium text-ink">{item.inspectorName}</div>
                      <div className="text-caption text-ink-secondary">{item.inspectorId}</div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-table-cell text-ink" title={item.violationDescription}>
                      {item.violationDescription}
                    </TableCell>
                    <TableCell className="text-table-cell">
                      {item.violationImageUrl ? (
                        <ImageIcon className="w-4 h-4 text-ink-secondary" aria-label="Photo attached" />
                      ) : (
                        <span className="text-ink-tertiary text-caption">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-table-cell text-ink-secondary tabular-nums">{format(new Date(item.createdAt), 'dd/MM/yyyy')}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile List */}
        <div className="md:hidden divide-y divide-border">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <MobileSkeletonCard key={i} />)
          ) : data.length === 0 && !error ? (
            <div className="p-12 text-center flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-surface-inset rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 text-ink-tertiary" aria-hidden="true" />
              </div>
              <p className="font-medium text-ink text-body">No entries yet</p>
              <p className="text-ink-secondary text-caption">Challans issued by inspectors will appear here.</p>
            </div>
          ) : (
            data.map((item) => (
              <div
                key={item.id}
                className={`p-4 space-y-2 active:bg-surface-inset/50 cursor-pointer ${
                  item.warningCount >= 3
                    ? '[box-shadow:inset_3px_0_0_hsl(var(--warning))]'
                    : ''
                }`}
                onClick={() => setSelectedChallan(item)}
                role="button"
                tabIndex={0}
                aria-label={`Open challan ${item.noticeNo}`}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedChallan(item); } }}
              >
                <div className="flex justify-between items-start">
                  <span className="flex items-center gap-1.5 font-semibold text-ink text-body tabular-nums">
                    {item.noticeNo}
                    {item.warningCount >= 3 && (
                      <span
                        className="inline-flex text-warning"
                        title={`High prior-warning count: ${item.warningCount}`}
                        aria-label={`High prior-warning count: ${item.warningCount}`}
                      >
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                    )}
                  </span>
                  <span className="text-caption text-ink-tertiary tabular-nums">{format(new Date(item.datetime), 'dd/MM/yyyy HH:mm')}</span>
                </div>
                <div>
                  <div className="font-medium text-ink text-body">{item.citizenName}</div>
                  <div className="text-caption text-ink-secondary line-clamp-1 flex items-center gap-1">
                    {item.violationImageUrl && <ImageIcon className="w-3 h-3 text-ink-secondary shrink-0" />}
                    <span className="truncate">{item.violationDescription}</span>
                  </div>
                </div>
                <div className="text-caption text-ink-tertiary flex justify-between">
                  <span>{item.town}</span>
                  <span>{item.inspectorName}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-caption pb-16 md:pb-0">
        <div className="text-ink-secondary">
          Showing {data.length} of {total} entries
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedChallan} onOpenChange={(open) => !open && setSelectedChallan(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Challan Details: {selectedChallan?.noticeNo}</DialogTitle>
          </DialogHeader>

          {selectedChallan && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <h4 className="text-section text-ink border-b border-border pb-2">Violation Details</h4>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-body">
                  <span className="text-ink-secondary">Date/Time:</span>
                  <span className="font-medium text-ink tabular-nums">{format(new Date(selectedChallan.datetime), 'dd/MM/yyyy hh:mm a')}</span>

                  <span className="text-ink-secondary">Category:</span>
                  <span className="font-medium text-ink">{selectedChallan.violationDescription}</span>

                  <span className="text-ink-secondary">Location:</span>
                  <span className="font-medium text-ink">{selectedChallan.location}</span>

                  <span className="text-ink-secondary">UC:</span>
                  <span className="font-medium text-ink">{selectedChallan.uc}</span>

                  <span className="text-ink-secondary">Zone/Tehsil:</span>
                  <span className="font-medium text-ink">{selectedChallan.zone} / {selectedChallan.tehsil}</span>

                  <span className="text-ink-secondary">District/Town:</span>
                  <span className="font-medium text-ink">{selectedChallan.district} / {selectedChallan.town}</span>

                  <span className="text-ink-secondary">Warning Count:</span>
                  <span className="font-medium text-ink tabular-nums">{selectedChallan.warningCount}</span>
                </div>
                {selectedChallan.violationImageUrl && (
                  <div className="mt-4">
                    <span className="text-ink-secondary block mb-2 text-body">Violation Photo (Click to view full size):</span>
                    <a
                      href={`/api/blob?pathname=${encodeURIComponent(selectedChallan.violationImageUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block hover:opacity-90"
                    >
                      <img
                        src={`/api/blob?pathname=${encodeURIComponent(selectedChallan.violationImageUrl)}`}
                        alt="Violation photo"
                        className="rounded-md border border-border max-w-full"
                        style={{ maxWidth: '320px' }}
                      />
                    </a>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="text-section text-ink border-b border-border pb-2">Citizen Details</h4>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-body">
                  <span className="text-ink-secondary">Name:</span>
                  <span className="font-medium text-ink">{selectedChallan.citizenName}</span>

                  <span className="text-ink-secondary">CNIC:</span>
                  <span className="font-medium text-ink">{selectedChallan.citizenCnic}</span>

                  <span className="text-ink-secondary">Phone:</span>
                  <span className="font-medium text-ink">{selectedChallan.citizenPhone}</span>

                  <span className="text-ink-secondary">Address:</span>
                  <span className="font-medium text-ink">{selectedChallan.citizenAddress}</span>
                </div>
              </div>

              <div className="space-y-4 md:col-span-2">
                <h4 className="text-section text-ink border-b border-border pb-2">Inspector &amp; System</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-2 text-body">
                  <span className="text-ink-secondary">Inspector Name:</span>
                  <span className="font-medium text-ink">{selectedChallan.inspectorName}</span>

                  <span className="text-ink-secondary">Inspector ID:</span>
                  <span className="font-medium text-ink">{selectedChallan.inspectorId}</span>

                  <span className="text-ink-secondary">Created At:</span>
                  <span className="font-medium text-ink tabular-nums">{format(new Date(selectedChallan.createdAt), 'dd/MM/yyyy HH:mm')}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
