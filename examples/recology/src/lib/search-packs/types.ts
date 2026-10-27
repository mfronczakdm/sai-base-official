export type SearchFacetKey = 'topic' | 'type';

export type SearchResultItem = {
  id: string;
  title: string;
  summary: string;
  href: string;
  topic: string;
  type: string;
  /** Extra terms for natural-language matching (locations, synonyms, intents). */
  keywords?: string[];
  /** Short answer shown when this item is a Q&A match. */
  answer?: string;
  /** Related deep links shown under a Q&A answer. */
  relatedLinks?: Array<{ label: string; href: string }>;
  featured?: boolean;
};

export type SearchPack = {
  siteName: string;
  popularSearches: string[];
  items: SearchResultItem[];
};

export type ScoredSearchResult = SearchResultItem & { score: number };
