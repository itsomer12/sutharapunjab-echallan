'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, FileStack, BarChart3, FilePlus, LogOut } from 'lucide-react';

export default function Shell({ children, role }: { children: React.ReactNode; role: 'admin' | 'inspector' }) {
  const pathname = usePathname();
  const router = useRouter();

  const adminLinks = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/entries', label: 'Challans', icon: FileStack },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const inspectorLinks = [
    { href: '/inspector', label: 'New Challan', icon: FilePlus },
  ];

  const links = role === 'admin' ? adminLinks : inspectorLinks;
  const isAdmin = role === 'admin';

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch {
      router.push('/login');
    }
  }

  function isActive(href: string) {
    if (href === '/admin' || href === '/inspector') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  }

  return (
    <div className="flex h-screen flex-col md:flex-row bg-surface-page text-ink">
      {/* Sidebar */}
      <aside
        className={`hidden md:flex flex-col w-56 border-r ${
          isAdmin
            ? 'bg-primary border-primary-hover text-primary-on'
            : 'bg-surface-inset border-border'
        }`}
      >
        <div
          className={`px-5 py-4 flex items-center gap-2.5 border-b ${
            isAdmin ? 'border-white/15' : 'border-border'
          }`}
        >
          <Image
            src="/suthra-punjab-logo.png"
            alt="Suthra Punjab"
            width={126}
            height={106}
            className="h-10 w-auto shrink-0"
            priority
          />
          <span className={`text-section ${isAdmin ? 'text-primary-on' : 'text-ink'}`}>
            Suthra Punjab
          </span>
        </div>

        <nav className="flex flex-col gap-0.5 flex-1 px-3 py-3" aria-label="Main navigation">
          {links.map(link => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isAdmin
                    ? `flex items-center gap-2.5 px-3 py-2.5 text-body rounded-sm border-l-[3px] focus:outline-none focus:ring-2 focus:ring-white/40
                      ${active
                        ? 'border-l-white bg-white/15 font-semibold text-primary-on'
                        : 'border-l-transparent text-primary-on/80 hover:bg-white/10 hover:text-primary-on'
                      }`
                    : `flex items-center gap-2.5 px-3 py-2 text-body border-l-[3px] focus:outline-none focus:ring-2 focus:ring-ring
                      ${active
                        ? 'border-l-primary font-semibold text-ink'
                        : 'border-l-transparent text-ink-secondary hover:text-ink'
                      }`
                }
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className={`px-3 py-3 border-t ${isAdmin ? 'border-white/15' : 'border-border'}`}>
          <button
            type="button"
            onClick={handleLogout}
            className={
              isAdmin
                ? 'flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-sm border-l-[3px] border-l-transparent text-body text-primary-on/80 hover:bg-white/10 hover:text-primary-on focus:outline-none focus:ring-2 focus:ring-white/40'
                : 'flex items-center gap-2.5 w-full text-left px-3 py-2 border-l-[3px] border-l-transparent text-body text-ink-secondary hover:text-ink focus:outline-none focus:ring-2 focus:ring-ring'
            }
          >
            <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface-page">
        <div className="flex items-center gap-2">
          <Image
            src="/suthra-punjab-logo.png"
            alt="Suthra Punjab"
            width={126}
            height={106}
            className="h-9 w-auto shrink-0"
            priority
          />
          <span className="text-section text-ink">Suthra Punjab</span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="text-caption text-ink-secondary hover:text-ink py-1 px-2 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Sign out
        </button>
      </header>

      {/* Main content — 16px mobile / 32px desktop gutters */}
      <main className={`flex-1 overflow-y-auto p-4 md:p-8 ${links.length > 1 ? 'pb-20 md:pb-8' : ''}`}>
        {children}
      </main>

      {/* Mobile bottom nav (admin multi-link only) */}
      {links.length > 1 && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-surface-page flex justify-around py-1 z-50"
          aria-label="Mobile navigation"
        >
          {links.map(link => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center justify-center px-3 py-2 min-h-[48px] min-w-[48px] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring
                  ${active ? 'text-primary font-semibold' : 'text-ink-secondary'}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                <span className="text-[11px] mt-1 font-medium">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
