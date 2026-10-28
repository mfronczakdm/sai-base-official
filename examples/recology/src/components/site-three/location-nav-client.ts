'use client';

import { useLayoutEffect, useState } from 'react';
import type { LocationNavResult } from '@/lib/location-nav-from-edge';

const NAV_CACHE_PREFIX = 'recology-location-nav:v1';

/** Survives client navigations in this tab. sessionStorage covers full page loads. */
const memoryNavCache = new Map<string, LocationNavResult>();
const pendingNavLoads = new Map<string, Promise<LocationNavResult | null>>();

/** Test hook. Demo pages keep this cache for the browser tab. */
export const clearLocationNavMemoryCache = () => {
  memoryNavCache.clear();
  pendingNavLoads.clear();
};

const navCacheKey = (itemId: string, language: string) =>
  `${NAV_CACHE_PREFIX}:${language}:${itemId.replace(/[{}]/g, '').toLowerCase()}`;

const readStoredNav = (key: string): LocationNavResult | null => {
  const memoryHit = memoryNavCache.get(key);
  if (memoryHit?.sections?.length) return memoryHit;

  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocationNavResult;
    if (!parsed?.sections?.length) return null;
    memoryNavCache.set(key, parsed);
    return parsed;
  } catch {
    return null;
  }
};

const writeStoredNav = (key: string, nav: LocationNavResult) => {
  if (!nav.sections?.length) return;
  memoryNavCache.set(key, nav);
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(nav));
  } catch {
    // Demo cache only. A full sessionStorage should not block the menu.
  }
};

export const loadLocationNav = (
  itemId: string,
  language: string
): Promise<LocationNavResult | null> => {
  const key = navCacheKey(itemId, language);
  const stored = readStoredNav(key);
  if (stored) return Promise.resolve(stored);

  const pending = pendingNavLoads.get(key);
  if (pending) return pending;

  const params = new URLSearchParams({ itemId, language });
  const request = fetch(`/api/location-nav?${params.toString()}`)
    .then((response) => (response.ok ? response.json() : null))
    .then((data: LocationNavResult | null) => {
      if (data?.sections?.length) writeStoredNav(key, data);
      return data;
    })
    .catch(() => null)
    .finally(() => {
      pendingNavLoads.delete(key);
    });

  pendingNavLoads.set(key, request);
  return request;
};

export const useLocationNav = (itemId?: string, language = 'en'): LocationNavResult | null => {
  const [nav, setNav] = useState<LocationNavResult | null>(null);

  useLayoutEffect(() => {
    if (!itemId) {
      setNav(null);
      return;
    }

    const stored = readStoredNav(navCacheKey(itemId, language));
    if (stored) {
      setNav(stored);
      return;
    }

    let cancelled = false;
    loadLocationNav(itemId, language).then((data) => {
      if (!cancelled) setNav(data);
    });

    return () => {
      cancelled = true;
    };
  }, [itemId, language]);

  return nav;
};
