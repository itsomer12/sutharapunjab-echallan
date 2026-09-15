'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, UserPlus } from 'lucide-react';
import { TOWNS } from '@/lib/constants';

type User = {
  id: number;
  name: string;
  cnic: string;
  contactNo: string;
  town: string;
  username: string;
  staffId: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
};


/* ---- Skeleton for loading state ---- */
function TableSkeleton() {
  return (
    <>
      {/* Desktop skeleton */}
      <div className="hidden md:block">
        <div className="px-6 py-3 bg-surface-inset border-b border-border">
          <div className="flex gap-8">
            {['w-32', 'w-28', 'w-20', 'w-24', 'w-16', 'w-12'].map((w, i) => (
              <div key={i} className={`h-3 ${w} bg-border rounded-sm animate-pulse`} />
            ))}
          </div>
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-6 py-4 border-b border-border">
            <div className="flex gap-8 items-center">
              <div className="w-32 space-y-2">
                <div className="h-4 bg-surface-inset rounded-sm animate-pulse" />
                <div className="h-3 w-20 bg-surface-inset rounded-sm animate-pulse" />
              </div>
              <div className="w-28 space-y-2">
                <div className="h-4 bg-surface-inset rounded-sm animate-pulse" />
                <div className="h-3 w-24 bg-surface-inset rounded-sm animate-pulse" />
              </div>
              <div className="h-4 w-20 bg-surface-inset rounded-sm animate-pulse" />
              <div className="h-4 w-24 bg-surface-inset rounded-sm animate-pulse" />
              <div className="h-6 w-16 bg-surface-inset rounded-full animate-pulse" />
              <div className="h-4 w-12 bg-surface-inset rounded-sm animate-pulse ml-auto" />
            </div>
          </div>
        ))}
      </div>
      {/* Mobile skeleton */}
      <div className="md:hidden divide-y divide-border">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 space-y-3">
            <div className="flex justify-between">
              <div className="space-y-2">
                <div className="h-4 w-32 bg-surface-inset rounded-sm animate-pulse" />
                <div className="h-3 w-40 bg-surface-inset rounded-sm animate-pulse" />
              </div>
              <div className="h-5 w-14 bg-surface-inset rounded-full animate-pulse" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="h-4 bg-surface-inset rounded-sm animate-pulse" />
              <div className="h-4 bg-surface-inset rounded-sm animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    cnic: '',
    contactNo: '',
    town: TOWNS[0],
    staffId: '',
    username: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setFetchError(null);
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Failed to load inspector accounts. Please try again.');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setFetchError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  function handleOpenModal(user?: User) {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        cnic: user.cnic,
        contactNo: user.contactNo,
        town: user.town || TOWNS[0],
        staffId: user.staffId,
        username: user.username,
        password: '',
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        cnic: '',
        contactNo: '',
        town: TOWNS[0],
        staffId: '',
        username: '',
        password: '',
      });
    }
    setError('');
    setIsModalOpen(true);
  }

  async function handleToggleStatus(user: User) {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      // Optimistic update
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
      
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }
    } catch {
      // Revert on error
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: user.status } : u));
      setFetchError('Failed to update user status. Please try again.');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
      const method = editingUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      await fetchUsers();
      setIsModalOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  // Handle Escape key to close modal
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && isModalOpen) setIsModalOpen(false);
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isModalOpen]);

  return (
    <div className="max-w-[960px] mx-auto pb-16 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-page-title text-ink">Inspector Accounts</h1>
          <p className="text-body text-ink-secondary mt-1">Manage field inspectors and enforcement officers.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary text-primary-on px-4 py-2.5 rounded-sm text-button hover:bg-primary-hover self-start sm:self-auto focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2 inline-flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" aria-hidden="true" />
          Add Inspector
        </button>
      </div>

      {/* Fetch error banner */}
      {fetchError && (
        <div className="mb-4 rounded-sm bg-danger-subtle border border-danger/20 px-4 py-3 text-body text-danger-text flex items-center justify-between" role="alert">
          <span>{fetchError}</span>
          <button
            onClick={() => { setFetchError(null); setLoading(true); fetchUsers(); }}
            className="text-danger-text hover:text-danger font-medium text-body px-3 py-1 rounded-sm hover:bg-danger/10 shrink-0 ml-3"
          >
            Retry
          </button>
        </div>
      )}

      <div className="bg-surface-card rounded-md border border-border overflow-hidden">
        {loading ? (
          <TableSkeleton />
        ) : users.length === 0 && !fetchError ? (
          <div className="p-12 text-center flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-surface-inset rounded-full flex items-center justify-center mb-1">
              <UserPlus className="w-5 h-5 text-ink-tertiary" aria-hidden="true" />
            </div>
            <p className="text-section text-ink">No inspectors found</p>
            <p className="text-body text-ink-secondary">Get started by creating a new inspector account.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table — sentence-case headers, no uppercase */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-table-cell text-left">
                <thead className="text-table-head text-ink-secondary bg-surface-inset border-b border-border">
                  <tr>
                    <th scope="col" className="px-6 py-3 font-semibold normal-case tracking-normal">Name and Staff ID</th>
                    <th scope="col" className="px-6 py-3 font-semibold normal-case tracking-normal">Contact</th>
                    <th scope="col" className="px-6 py-3 font-semibold normal-case tracking-normal">Town</th>
                    <th scope="col" className="px-6 py-3 font-semibold normal-case tracking-normal">Created</th>
                    <th scope="col" className="px-6 py-3 font-semibold normal-case tracking-normal">Status</th>
                    <th scope="col" className="px-6 py-3 font-semibold normal-case tracking-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-surface-inset/50">
                      <td className="px-6 py-3.5">
                        <div className="font-medium text-ink">{user.name}</div>
                        <div className="text-ink-secondary mt-0.5 text-caption flex items-center gap-2">
                          <span>{user.staffId}</span>
                          <span className="text-border" aria-hidden="true">&middot;</span>
                          <span>{user.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="text-ink">{user.contactNo}</div>
                        <div className="text-ink-secondary text-caption mt-0.5">{user.cnic}</div>
                      </td>
                      <td className="px-6 py-3.5 text-ink">{user.town}</td>
                      <td className="px-6 py-3.5 text-ink-secondary">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3.5">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          aria-label={`Toggle ${user.name} status from ${user.status.toLowerCase()}`}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-badge border focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-border-focus
                            ${user.status === 'ACTIVE'
                              ? 'bg-primary-subtle text-primary border-primary/20'
                              : 'bg-danger-subtle text-danger border-danger/20'
                            }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${user.status === 'ACTIVE' ? 'bg-primary' : 'bg-danger'}`} aria-hidden="true"></span>
                          {user.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => handleOpenModal(user)}
                          className="text-ink-secondary hover:text-ink font-medium text-body px-3 py-1.5 rounded-sm hover:bg-surface-inset focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-1"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="md:hidden divide-y divide-border">
              {users.map((user) => (
                <div key={user.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-ink text-body">{user.name}</div>
                      <div className="text-ink-secondary text-caption mt-1">ID: {user.staffId} &middot; @{user.username}</div>
                    </div>
                    <button
                      onClick={() => handleToggleStatus(user)}
                      aria-label={`Toggle ${user.name} status from ${user.status.toLowerCase()}`}
                      className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-badge border
                        ${user.status === 'ACTIVE'
                          ? 'bg-primary-subtle text-primary border-primary/20'
                          : 'bg-danger-subtle text-danger border-danger/20'
                        }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${user.status === 'ACTIVE' ? 'bg-primary' : 'bg-danger'}`} aria-hidden="true"></span>
                      {user.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-body">
                    <div>
                      <div className="text-ink-tertiary text-caption">Town</div>
                      <div className="text-ink">{user.town}</div>
                    </div>
                    <div>
                      <div className="text-ink-tertiary text-caption">Contact</div>
                      <div className="text-ink">{user.contactNo}</div>
                    </div>
                    <div className="col-span-2 flex justify-between">
                      <div>
                        <div className="text-ink-tertiary text-caption">CNIC</div>
                        <div className="text-ink">{user.cnic}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-ink-tertiary text-caption">Joined</div>
                        <div className="text-ink">{new Date(user.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <button
                      onClick={() => handleOpenModal(user)}
                      className="w-full text-center py-2.5 text-ink text-body font-medium border border-border rounded-sm bg-surface-card hover:bg-surface-inset focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-1"
                    >
                      Edit Inspector
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal Overlay — only element with shadow */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
        >
          <div className="bg-surface-card rounded-lg shadow-[0_16px_48px_rgba(0,0,0,0.12)] border border-border w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-surface-card sticky top-0 z-10">
              <h2 id="user-modal-title" className="text-section text-ink">
                {editingUser ? 'Edit Inspector' : 'Create Inspector'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-ink-tertiary hover:text-ink p-1.5 rounded-sm hover:bg-surface-inset focus:outline-none focus:ring-2 focus:ring-border-focus"
                aria-label="Close dialog"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              {error && (
                <div className="mb-4 p-3 bg-danger-subtle text-danger-text text-body rounded-sm border border-danger/20" role="alert">
                  {error}
                </div>
              )}

              <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="inspector-name" className="text-body font-medium text-ink block">Full Name</label>
                    <input
                      id="inspector-name"
                      required
                      type="text"
                      className="w-full px-3 py-2 border border-border rounded-sm text-body bg-surface-page focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-transparent"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Ali Khan"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="inspector-staff-id" className="text-body font-medium text-ink block">Staff ID / Badge No</label>
                    <input
                      id="inspector-staff-id"
                      required
                      type="text"
                      className="w-full px-3 py-2 border border-border rounded-sm text-body bg-surface-page focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-transparent"
                      value={formData.staffId}
                      onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                      placeholder="e.g. INS-001"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="inspector-cnic" className="text-body font-medium text-ink block">CNIC</label>
                    <input
                      id="inspector-cnic"
                      required
                      pattern="\d{5}-\d{7}-\d"
                      title="Format: 00000-0000000-0"
                      className="w-full px-3 py-2 border border-border rounded-sm text-body bg-surface-page focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-transparent"
                      value={formData.cnic}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.length > 13) val = val.slice(0, 13);
                        let formatted = val;
                        if (val.length > 5) {
                          formatted = val.slice(0, 5) + '-' + val.slice(5);
                        }
                        if (val.length > 12) {
                          formatted = formatted.slice(0, 13) + '-' + val.slice(12);
                        }
                        setFormData({ ...formData, cnic: formatted });
                      }}
                      placeholder="00000-0000000-0"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="inspector-contact" className="text-body font-medium text-ink block">Contact Number</label>
                    <input
                      id="inspector-contact"
                      required
                      type="text"
                      className="w-full px-3 py-2 border border-border rounded-sm text-body bg-surface-page focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-transparent"
                      value={formData.contactNo}
                      onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                      placeholder="0300-1234567"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="inspector-town" className="text-body font-medium text-ink block">Town Assignment</label>
                  <select
                    id="inspector-town"
                    required
                    className="w-full px-3 py-2 border border-border rounded-sm text-body bg-surface-page focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-transparent"
                    value={formData.town}
                    onChange={(e) => setFormData({ ...formData, town: e.target.value })}
                  >
                    {TOWNS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 mt-2 border-t border-border">
                  <h3 className="text-section text-ink mb-4">Login Credentials</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="inspector-username" className="text-body font-medium text-ink block">Username</label>
                      <input
                        id="inspector-username"
                        required
                        type="text"
                        className="w-full px-3 py-2 border border-border rounded-sm text-body bg-surface-page focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-transparent"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="inspector-password" className="text-body font-medium text-ink block">
                        Password
                        {editingUser && <span className="text-ink-tertiary font-normal ml-1">(Leave blank to keep)</span>}
                      </label>
                      <input
                        id="inspector-password"
                        required={!editingUser}
                        type="password"
                        className="w-full px-3 py-2 border border-border rounded-sm text-body bg-surface-page focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-transparent"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-border bg-surface-inset flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-button text-ink bg-surface-card border border-border rounded-sm hover:bg-surface-inset focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-1"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="user-form"
                disabled={saving}
                className="px-4 py-2 text-button text-primary-on bg-primary rounded-sm hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    Saving...
                  </>
                ) : (
                  editingUser ? 'Update Inspector' : 'Create Inspector'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
