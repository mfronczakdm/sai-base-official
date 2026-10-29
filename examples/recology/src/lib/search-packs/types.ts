export type SearchFacetKey = 'topic' | 'type' | 'region';

export type SearchResultItem = {
  id: string;
  title: string;
  summary: string;
  href: string;
  topic: string;
  type: string;
  /**
   * Service area for the Region facet.
   * LocationItem pages under /Location are regions. Child pages inherit that region from the URL.
   * Set this when an item lives outside /Location but still belongs to one region.
   * Use an empty string when the result is company-wide even if href sits under one location.
   */
  region?: string;
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
