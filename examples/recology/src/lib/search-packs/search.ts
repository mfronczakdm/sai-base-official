import type { SearchPack, SearchResultItem, ScoredSearchResult } from './types';

/** Common NL filler words so queries like "I am moving to San Bruno…" still match. */
const STOP_WORDS = new Set([
  'a',
  'am',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'can',
  'do',
  'does',
  'for',
  'from',
  'get',
  'have',
  'how',
  'i',
  'im',
  'in',
  'into',
  'is',
  'it',
  'me',
  'my',
  'need',
  'of',
  'on',
  'or',
  'our',
  'please',
  'should',
  'the',
  'to',
  'we',
  'what',
  'when',
  'where',
  'which',
  'who',
  'with',
  'you',
  'your',
  'looking',
  'about',
  'help',
  'there',
  'this',
  'that',
  'any',
  'some',
]);

export function tokenizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

/** LocationItem under /Location, from a site path such as /Location/Recology-American-Canyon/News. */
export function regionFromHref(href?: string): string | undefined {
  if (!href) return undefined;
  const match = href.match(/^\/Location\/([^/?#]+)/i);
  if (!match) return undefined;
  const name = decodeURIComponent(match[1]).replace(/-/g, ' ').trim();
  return name || undefined;
}

export function itemRegion(item: SearchResultItem): string | undefined {
  // An explicit region wins, including "" when a link points at one region but the result is company-wide.
  if (item.region !== undefined) return item.region || undefined;
  return regionFromHref(item.href);
}

const itemHaystack = (item: SearchResultItem): string =>
  [
    item.title,
    item.summary,
    item.topic,
    item.type,
    itemRegion(item) || '',
    item.answer || '',
    ...(item.keywords || []),
    ...(item.relatedLinks || []).map((link) => link.label),
  ]
    .join(' ')
    .toLowerCase();

export function scoreSearchItem(item: SearchResultItem, query: string, tokens: string[]): number {
  if (!query.trim()) return item.featured ? 1 : 0;

  const haystack = itemHaystack(item);
  const q = query.trim().toLowerCase();
  let score = 0;

  if (haystack.includes(q)) score += 120;

  for (const token of tokens) {
    if (!haystack.includes(token)) continue;
    score += token.length >= 6 ? 14 : 8;
    if (item.title.toLowerCase().includes(token)) score += 6;
    if ((item.keywords || []).some((keyword) => keyword.toLowerCase().includes(token))) {
      score += 12;
    }
  }

  // Phrase / multi-word keyword boost (e.g. "san bruno", "waste management")
  for (const keyword of item.keywords || []) {
    const normalized = keyword.toLowerCase();
    if (normalized.includes(' ') && q.includes(normalized)) score += 40;
  }

  if (item.type === 'Q&A' && score > 0) score += 25;
  if (item.type === 'News' && score > 0) score += 8;
  if (item.featured && score > 0) score += 5;

  return score;
}

export type SearchFilters = { topic?: string; type?: string; region?: string };

export function searchPackItems(
  pack: SearchPack,
  query: string,
  filters: SearchFilters = {}
): SearchResultItem[] {
  return rankSearchPackItems(pack, query, filters).map(({ score: _score, ...item }) => item);
}

export function rankSearchPackItems(
  pack: SearchPack,
  query: string,
  filters: SearchFilters = {}
): ScoredSearchResult[] {
  const q = query.trim();
  const tokens = tokenizeQuery(q);

  const candidates = pack.items.filter((item) => {
    if (filters.topic && item.topic !== filters.topic) return false;
    if (filters.type && item.type !== filters.type) return false;
    if (filters.region && itemRegion(item) !== filters.region) return false;
    return true;
  });

  if (!q) {
    return candidates.map((item) => ({ ...item, score: item.featured ? 1 : 0 }));
  }

  return candidates
    .map((item) => ({ ...item, score: scoreSearchItem(item, q, tokens) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
}

/** Top Q&A matches for the answer panel above organic results. */
export function findQaAnswers(
  pack: SearchPack,
  query: string,
  limit = 2,
  filters: SearchFilters = {}
): ScoredSearchResult[] {
  if (!query.trim()) return [];
  return rankSearchPackItems(pack, query, filters)
    .filter((item) => item.type === 'Q&A' && Boolean(item.answer))
    .slice(0, limit);
}

export function facetCounts(
  items: SearchResultItem[],
  key: 'topic' | 'type' | 'region'
): Array<{ value: string; count: number }> {
  const map = new Map<string, number>();
  for (const item of items) {
    const value = key === 'topic' ? item.topic : key === 'type' ? item.type : itemRegion(item);
    if (!value) continue;
    map.set(value, (map.get(value) || 0) + 1);
  }
  return [...map.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}
