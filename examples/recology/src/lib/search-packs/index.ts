import { recologySearchPack } from './recology';
import { facetCounts, findQaAnswers, rankSearchPackItems, searchPackItems, tokenizeQuery } from './search';
import type { SearchPack, SearchResultItem } from './types';

export type { SearchFacetKey, SearchPack, SearchResultItem, ScoredSearchResult } from './types';
export { facetCounts, findQaAnswers, rankSearchPackItems, searchPackItems, tokenizeQuery };

const packs: Record<string, SearchPack> = {
  [recologySearchPack.siteName]: recologySearchPack,
};

export function getSearchPack(siteName?: string | null): SearchPack {
  const key = (siteName || process.env.NEXT_PUBLIC_DEFAULT_SITE_NAME || 'recology').toLowerCase();
  return packs[key] || recologySearchPack;
}
