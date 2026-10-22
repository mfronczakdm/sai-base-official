import type { PracticeTopic } from './practice-listing.props';

const ACCESS_BY_ID: Record<string, string> = {
  '30f685cf35604abcbc54b56945e6e9e1': 'Certificate holder',
  '0152c7231da541d8961af40dd634cad4': 'Member-only',
  '15576c6d8009411da37b313e88a4c213': 'Public',
  '034dfbb564eb4b269aebccea87841d05': 'Subscriber',
};

const normalizeId = (value: string): string => value.replace(/[{}-]/g, '').toLowerCase();

export const accessNamesFromValue = (value: string | null | undefined): string[] => {
  if (!value) return [];

  const names = value
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const mapped = ACCESS_BY_ID[normalizeId(part)];
      if (mapped) return mapped;
      return normalizeId(part).length === 32 ? '' : part;
    })
    .filter(Boolean);

  return [...new Set(names)];
};

export const canViewPracticePage = (
  access: string[],
  certificationStatus?: string | null
): boolean => {
  const names = access.map((name) => name.trim().toLowerCase()).filter(Boolean);
  if (names.includes('public')) return true;

  const status = certificationStatus?.trim().toLowerCase();
  if (!status) return false;

  return names.includes(status);
};

type SearchField = { value?: string };

export type PracticeSearchHit = {
  id?: string;
  name?: string;
  version?: number | string;
  url?: { path?: string };
  pageTitle?: SearchField;
  navigationTitle?: SearchField;
  pageSummary?: SearchField;
  access?: SearchField;
};

const readText = (field?: SearchField): string =>
  typeof field?.value === 'string' ? field.value.trim() : '';

const toTopic = (hit: PracticeSearchHit): PracticeTopic | null => {
  const href = hit.url?.path?.trim();
  if (!hit.id || !href || href.includes('/Data/')) return null;

  return {
    id: hit.id,
    title: readText(hit.pageTitle) || readText(hit.navigationTitle) || hit.name || 'Practice topic',
    href,
    summary: readText(hit.pageSummary),
    access: accessNamesFromValue(hit.access?.value),
  };
};

export const selectPracticeTopics = (hits: PracticeSearchHit[]): PracticeTopic[] => {
  const chosen = new Map<string, { version: number; topic: PracticeTopic }>();

  for (const hit of hits) {
    const topic = toTopic(hit);
    if (!topic) continue;

    const version = Number(hit.version) || 0;
    const current = chosen.get(topic.id);
    if (current && current.version > version) continue;
    chosen.set(topic.id, { version, topic });
  }

  return [...chosen.values()].map((entry) => entry.topic);
};
