import type { DemoGuest } from '@/demo/demo-guests';

export const DEMO_GUEST_STORAGE_KEY = 'asha-demo-guest-email';
export const DEMO_PANEL_STORAGE_KEY = 'asha-demo-guest-panel';
export const DEMO_TRAIL_STORAGE_KEY = 'asha-demo-visit-trail';

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

  if (value.includes('convention') || value.includes('event')) return 'convention interest';
  if (value.includes('certif')) return 'certification interest';
  if (value.includes('career') || value.includes('job')) return 'career interest';
  if (value.includes('news') || value.includes('article') || value.includes('blog')) {
    return 'article interest';
  }
  if (value.includes('hearing') || value.includes('audiolog')) return 'hearing interest';

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
      ? 'This visit has not shown a new interest yet. Open an event, article, or certification page.'
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
