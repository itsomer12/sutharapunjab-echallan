'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EqualizerLoader, useDashboardLoading, useSmoothLoading } from '@/components/DashboardLoading';

type ReportRecipient = {
  id: number;
  email: string;
  label: string;
  active: boolean;
  createdAt: string;
};

export default function ReportRecipients() {
  const [recipients, setRecipients] = useState<ReportRecipient[]>([]);
  const [email, setEmail] = useState('');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { track } = useDashboardLoading();
  const listLoading = useSmoothLoading(loading);

  useEffect(() => {
    void loadRecipients();
  }, []);

  async function loadRecipients() {
    setLoading(true);
    setError(null);
    try {
      const response = await track(() => fetch('/api/admin/report-recipients'));
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to load recipients.');
      setRecipients(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load recipients.');
    } finally {
      setLoading(false);
    }
  }

  async function addRecipient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await track(() => fetch('/api/admin/report-recipients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, label }),
      }));
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to add recipient.');
      setRecipients((current) => [payload, ...current]);
      setEmail('');
      setLabel('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add recipient.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleRecipient(recipient: ReportRecipient) {
    setPendingId(recipient.id);
    setError(null);
    const active = !recipient.active;
    setRecipients((current) => current.map((item) => item.id === recipient.id ? { ...item, active } : item));

    try {
      const response = await track(() => fetch(`/api/admin/report-recipients/${recipient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      }));
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to update recipient.');
      setRecipients((current) => current.map((item) => item.id === recipient.id ? payload : item));
    } catch (err) {
      setRecipients((current) => current.map((item) => item.id === recipient.id ? recipient : item));
      setError(err instanceof Error ? err.message : 'Unable to update recipient.');
    } finally {
      setPendingId(null);
    }
  }

  async function removeRecipient(recipient: ReportRecipient) {
    if (!window.confirm(`Remove ${recipient.email} from the report mailing list?`)) return;

    setPendingId(recipient.id);
    setError(null);
    try {
      const response = await track(() => fetch(`/api/admin/report-recipients/${recipient.id}`, { method: 'DELETE' }));
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || 'Unable to remove recipient.');
      }
      setRecipients((current) => current.filter((item) => item.id !== recipient.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove recipient.');
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="rounded-md border border-border bg-surface-card" aria-busy={loading}>
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-section text-ink">Report email recipients</h2>
        <p className="mt-0.5 text-caption text-ink-secondary">
          Manage the mailing list for reports. Recipients do not receive login access.
        </p>
      </div>

      <form onSubmit={addRecipient} className="grid gap-3 border-b border-border p-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
        <label className="block text-caption font-medium text-ink-secondary">
          Email address
          <Input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 bg-surface-page"
            placeholder="reports@example.gov.pk"
          />
        </label>
        <label className="block text-caption font-medium text-ink-secondary">
          Name or label
          <Input
            type="text"
            required
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            className="mt-1 bg-surface-page"
            placeholder="e.g. Operations team"
          />
        </label>
        <Button type="submit" disabled={saving} className="sm:mb-0">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
          Add recipient
        </Button>
      </form>

      {error && (
        <div className="mx-5 mt-4 flex items-center justify-between gap-3 rounded-sm border border-danger/20 bg-danger-subtle px-4 py-3 text-body text-danger-text" role="alert">
          <span>{error}</span>
          <Button type="button" variant="ghost" size="sm" onClick={loadRecipients}>Retry</Button>
        </div>
      )}

      {loading && (recipients.length === 0 || listLoading) ? (
        <div className="flex h-24 items-center justify-center">
          <EqualizerLoader label="Loading recipients" />
        </div>
      ) : recipients.length === 0 ? (
        <p className="px-5 py-8 text-center text-body text-ink-secondary">No report recipients yet.</p>
      ) : (
        <div className="divide-y divide-border">
          {recipients.map((recipient) => (
            <div key={recipient.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium text-ink">{recipient.label}</p>
                <p className="truncate text-body text-ink-secondary">{recipient.email}</p>
              </div>
              <div className="flex items-center gap-3 self-start sm:self-auto">
                <button
                  type="button"
                  role="switch"
                  aria-checked={recipient.active}
                  aria-label={`Set ${recipient.label} to ${recipient.active ? 'inactive' : 'active'}`}
                  onClick={() => toggleRecipient(recipient)}
                  disabled={pendingId === recipient.id}
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${recipient.active ? 'bg-primary' : 'bg-ink-tertiary'}`}
                >
                  <span className={`inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform ${recipient.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
                <span className={`min-w-[54px] text-caption font-medium ${recipient.active ? 'text-primary' : 'text-ink-secondary'}`}>
                  {recipient.active ? 'Active' : 'Inactive'}
                </span>
                <button
                  type="button"
                  onClick={() => removeRecipient(recipient)}
                  disabled={pendingId === recipient.id}
                  className="rounded-sm p-2 text-ink-secondary hover:bg-danger-subtle hover:text-danger focus:outline-none focus:ring-2 focus:ring-border-focus disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label={`Remove ${recipient.label}`}
                >
                  {pendingId === recipient.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
