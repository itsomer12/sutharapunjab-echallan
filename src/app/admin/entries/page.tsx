import { Metadata } from 'next';
import EntriesClient from './EntriesClient';

export const metadata: Metadata = {
  title: 'Challan Entries - Admin',
  description: 'View and filter all issued challans',
};

export default function EntriesPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-page-title text-ink">Challan Entries</h1>
        <p className="text-body text-ink-secondary mt-1">Browse, search, and filter all issued e-challans.</p>
      </div>
      <EntriesClient />
    </div>
  );
}
