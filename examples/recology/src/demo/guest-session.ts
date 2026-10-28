import type { DemoGuest } from '@/demo/demo-guests';

export const DEMO_GUEST_STORAGE_KEY = 'recology-demo-guest-email';
export const DEMO_PANEL_STORAGE_KEY = 'recology-demo-guest-panel';
export const DEMO_TRAIL_STORAGE_KEY = 'recology-demo-visit-trail';
export const DEMO_GUEST_BOUND_KEY = 'recology-demo-guest-bound';
export const DEMO_GUEST_BOUND_COOKIE = 'recology-demo-guest-bound';
export const DEMO_GUEST_CHANGED_EVENT = 'recology-demo-guest-changed';
/** Set on profile click. The next page refreshes once so Sitecore can apply the guest. */
export const PERSONALIZE_CONFIRM_KEY = 'recology-demo-personalize-confirm';
/** Sitecore reads the guest on the request after identity, which is the manual refresh today. */
export const PERSONALIZE_CONFIRM_DELAY_MS = 2000;

const MAX_TRAIL = 6;

export const isDemoGuestPanelEnabled = (
  envFlag: string | undefined,
  nodeEnv: string | undefined,
  sessionFlag: string | null
): boolean => {
  if (sessionFlag === '0') return false;
  if (envFlag === 'true') return true;
  if (sessionFlag === '1') return true;
  return nodeEnv === 'development';
};

export const learningTopic = (path: string): string | null => {
  const value = path.toLowerCase();

  if (value.includes('debris') || value.includes('box')) return 'debris box interest';
  if (value.includes('business') || value.includes('commercial')) return 'commercial interest';
  if (value.includes('pay') || value.includes('bill')) return 'billing interest';
  if (value.includes('sort') || value.includes('what-bin') || value.includes('what bin')) {
    return 'sorting interest';
  }
  if (value.includes('faq') || value.includes('holiday')) return 'service FAQ interest';
  if (value.includes('rate') || value.includes('cart') || value.includes('start')) {
    return 'start-service interest';
  }

  return null;
};

export type TriggeredAffinity = {
  value: string;
  source: 'profile' | 'visit';
};

export const triggeredAffinities = (
  guest: DemoGuest | undefined,
  paths: string[]
): TriggeredAffinity[] => {
  const seen = new Set<string>();
  const affinities: TriggeredAffinity[] = [];

  const add = (value: string | undefined, source: TriggeredAffinity['source']) => {
    const trimmed = value?.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    affinities.push({ value: trimmed, source });
  };

  if (guest) {
    add(guest.segment, 'profile');
    add(guest.location, 'profile');
    add(guest.contentAffinity, 'profile');
    add(guest.primaryInterest, 'profile');
  }

  paths.forEach((path) => add(learningTopic(path) ?? undefined, 'visit'));

  return affinities;
};

export const describeVisitLearning = (paths: string[]): string => {
  const latest = [...paths].reverse().find((path) => learningTopic(path));

  if (!latest) {
    return paths.length
      ? 'This visit has not shown a new interest yet. Open rates, sorting, bill pay, business, or debris pages.'
      : 'No pages recorded for this visit yet.';
  }

  return `This visit just added ${learningTopic(latest)}. Sitecore can use that on top of the profile it already has.`;
};

export const pageLabel = (path: string): string => {
  const parts = path.split('/').filter(Boolean);
  const last = parts[parts.length - 1] || 'Home';

  try {
    return decodeURIComponent(last).replace(/-/g, ' ');
  } catch {
    return last.replace(/-/g, ' ');
  }
};

export const appendVisitPath = (paths: string[], path: string): string[] => {
  if (!path || paths[paths.length - 1] === path) return paths;
  return [...paths, path].slice(-MAX_TRAIL);
};

export const readStoredTrail = (): string[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.sessionStorage.getItem(DEMO_TRAIL_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

export const writeStoredTrail = (paths: string[]): void => {
  window.sessionStorage.setItem(DEMO_TRAIL_STORAGE_KEY, JSON.stringify(paths));
};

export const clearStoredTrail = (): void => {
  window.sessionStorage.removeItem(DEMO_TRAIL_STORAGE_KEY);
};

const SITECORE_CLIENT_COOKIE = 'sc_cid';

/** A new browser session starts anonymous until a known guest is chosen. */
export const ensureAnonymousFirstLoad = (): void => {
  if (typeof window === 'undefined') return;
  if (window.sessionStorage.getItem(DEMO_GUEST_BOUND_KEY) === '1') return;
  window.localStorage.removeItem(DEMO_GUEST_STORAGE_KEY);
};

export const markGuestBound = (): void => {
  window.sessionStorage.setItem(DEMO_GUEST_BOUND_KEY, '1');
  document.cookie = `${DEMO_GUEST_BOUND_COOKIE}=1; Path=/; SameSite=Lax; Max-Age=86400`;
};

export const clearGuestBound = (): void => {
  window.sessionStorage.removeItem(DEMO_GUEST_BOUND_KEY);
  const expired = 'Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = `${DEMO_GUEST_BOUND_COOKIE}=; Path=/; Expires=${expired}; Max-Age=0`;
};

export const markPersonalizeConfirm = (): void => {
  window.sessionStorage.setItem(PERSONALIZE_CONFIRM_KEY, '1');
};

export const clearPersonalizeConfirm = (): void => {
  window.sessionStorage.removeItem(PERSONALIZE_CONFIRM_KEY);
};

export const cookieHeaderWithoutBrowserId = (cookieHeader: string | null): string =>
  (cookieHeader ?? '')
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part && !part.toLowerCase().startsWith(`${SITECORE_CLIENT_COOKIE}=`))
    .join('; ');

export const shouldPersonalizeAsAnonymous = (
  demoPanelEnabled: boolean,
  boundCookie: string | undefined
): boolean => demoPanelEnabled && boundCookie !== '1';

/** Drops the Cloud SDK browser id so the next page view is a new anonymous visitor. */
export const forgetSitecoreBrowser = (): void => {
  if (typeof document === 'undefined') return;

  const host = window.location.hostname.replace(/^www\./, '');
  const expired = 'Thu, 01 Jan 1970 00:00:00 GMT';
  const base = `${SITECORE_CLIENT_COOKIE}=; Path=/; Expires=${expired}; Max-Age=0`;
  const cookies = [
    base,
    `${base}; Domain=${host}`,
    `${base}; Secure; SameSite=None`,
    `${base}; Domain=${host}; Secure; SameSite=None`,
  ];

  cookies.forEach((cookie) => {
    document.cookie = cookie;
  });
};
