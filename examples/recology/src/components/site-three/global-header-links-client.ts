'use client';

import { useEffect, useState } from 'react';
import {
  GLOBAL_HEADER_LINK_FALLBACK,
  type GlobalHeaderLink,
} from '@/lib/global-header-links';

export const useGlobalHeaderLinks = (language: string): GlobalHeaderLink[] => {
  const [links, setLinks] = useState<GlobalHeaderLink[]>(GLOBAL_HEADER_LINK_FALLBACK);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch(
          `/api/global-header-links?language=${encodeURIComponent(language)}`
        );
        if (!response.ok) return;
        const data = (await response.json()) as { links?: GlobalHeaderLink[] };
        if (!cancelled && data.links?.length) setLinks(data.links);
      } catch {
        // Keep the fallback links when Edge is unavailable.
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [language]);

  return links;
};
