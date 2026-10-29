'use client';

import { useLayoutEffect, useState } from 'react';
import type { LocationNavResult } from '@/lib/location-nav-from-edge';

const NAV_CACHE_PREFIX = 'recology-location-nav:v1';
const REMEMBERED_LOCATION_KEY = 'recology-remembered-location:v1';

type RememberedLocation = { itemId: string; language: string };

/** Last LocationItem the visitor opened. Shared by the global and regional headers. */
let rememberedLocation: RememberedLocation | null = null;

export const rememberLocation = (itemId: string, language: string) => {
  const next = { itemId, language };
  rememberedLocation = next;
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(REMEMBERED_LOCATION_KEY, JSON.stringify(next));
  } catch {
    // The in-memory value still covers this tab.
  }
};

export const readRememberedLocationId = (language: string): string | undefined => {
  if (rememberedLocation?.language === language && rememberedLocation.itemId) {
    return rememberedLocation.itemId;
  }
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = window.sessionStorage.getItem(REMEMBERED_LOCATION_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as RememberedLocation;
    if (parsed?.language !== language || !parsed.itemId) return undefined;
    rememberedLocation = parsed;
    return parsed.itemId;
  } catch {
    return undefined;
  }
};

export const clearRememberedLocation = () => {
  rememberedLocation = null;
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(REMEMBERED_LOCATION_KEY);
  } catch {
    // Ignore storage failures in tests and private browsing.
  }
};

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

/** Item id of the last location, used when the current page is not under a LocationItem. */
export const useRememberedLocationId = (language: string, enabled: boolean): string | undefined => {
  const [itemId, setItemId] = useState<string | undefined>(undefined);

  useLayoutEffect(() => {
    setItemId(enabled ? readRememberedLocationId(language) : undefined);
  }, [enabled, language]);

  return itemId;
};

/** Remember a location once its nav has loaded, so later pages can show the same place. */
export const useRememberCurrentLocation = (
  itemId: string | undefined,
  language: string,
  nav: LocationNavResult | null
) => {
  useLayoutEffect(() => {
    if (!itemId || !nav?.locationHref) return;
    rememberLocation(itemId, language);
  }, [itemId, language, nav]);
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
