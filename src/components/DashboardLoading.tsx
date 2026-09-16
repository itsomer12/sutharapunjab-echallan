'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

const SHOW_AFTER_MS = 140;
const MIN_VISIBLE_MS = 320;

type LoadingContextValue = {
  track: <T,>(operation: () => Promise<T>) => Promise<T>;
  beginRoute: () => void;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

/** A compact, screen-reader-labelled loader based on the reference equalizer. */
export function EqualizerLoader({ label = 'Loading', className = '' }: { label?: string; className?: string }) {
  return (
    <span className={`dashboard-equalizer ${className}`} role="status" aria-label={label}>
      {Array.from({ length: 5 }).map((_, index) => <i key={index} aria-hidden="true" />)}
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Delays brief loading states and holds visible states long enough to avoid flicker. */
export function useSmoothLoading(active: boolean) {
  const [visible, setVisible] = useState(false);
  const shownAt = useRef(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (active) {
      timer = setTimeout(() => {
        shownAt.current = Date.now();
        setVisible(true);
      }, SHOW_AFTER_MS);
    } else if (visible) {
      timer = setTimeout(() => setVisible(false), Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt.current)));
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [active, visible]);

  return visible;
}

export function LoadingOverlay({ show, label = 'Updating this section' }: { show: boolean; label?: string }) {
  if (!show) return null;
  return (
    <div className="dashboard-loading-overlay" aria-live="polite" aria-label={label}>
      <EqualizerLoader label={label} />
    </div>
  );
}

export function CardSkeleton({ className = '', lines = 4 }: { className?: string; lines?: number }) {
  return (
    <div className={`dashboard-card-skeleton ${className}`} aria-busy="true" aria-label="Loading content">
      <EqualizerLoader />
      <div className="dashboard-skeleton-line w-1/3" />
      {Array.from({ length: lines }).map((_, index) => <div key={index} className={`dashboard-skeleton-line ${index % 2 ? 'w-4/5' : 'w-full'}`} />)}
    </div>
  );
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeCount = useRef(0);
  const delayTimer = useRef<ReturnType<typeof setTimeout>>();
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const shownAt = useRef(0);
  const routeEnd = useRef<(() => void) | null>(null);
  const [visible, setVisible] = useState(false);
  const visibleRef = useRef(false);

  useEffect(() => { visibleRef.current = visible; }, [visible]);

  const begin = useCallback(() => {
    activeCount.current += 1;
    if (activeCount.current === 1) {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      delayTimer.current = setTimeout(() => {
        shownAt.current = Date.now();
        visibleRef.current = true;
        setVisible(true);
      }, SHOW_AFTER_MS);
    }
    let finished = false;
    return () => {
      if (finished) return;
      finished = true;
      activeCount.current = Math.max(0, activeCount.current - 1);
      if (activeCount.current !== 0) return;
      if (delayTimer.current) clearTimeout(delayTimer.current);
      if (!visibleRef.current) return;
      hideTimer.current = setTimeout(() => {
        visibleRef.current = false;
        setVisible(false);
      }, Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt.current)));
    };
  }, []);

  const track = useCallback(async <T,>(operation: () => Promise<T>) => {
    const end = begin();
    try { return await operation(); } finally { end(); }
  }, [begin]);

  const beginRoute = useCallback(() => {
    routeEnd.current?.();
    routeEnd.current = begin();
  }, [begin]);

  useEffect(() => {
    routeEnd.current?.();
    routeEnd.current = null;
  }, [pathname]);

  useEffect(() => () => {
    if (delayTimer.current) clearTimeout(delayTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  return (
    <LoadingContext.Provider value={{ track, beginRoute }}>
      {visible && <div className="dashboard-route-progress" role="status" aria-label="Loading page" />}
      {children}
    </LoadingContext.Provider>
  );
}

export function useDashboardLoading() {
  const context = useContext(LoadingContext);
  if (!context) throw new Error('useDashboardLoading must be used inside LoadingProvider');
  return context;
}
