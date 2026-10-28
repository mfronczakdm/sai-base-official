import client from '@/lib/sitecore-client';
import { LOCATION_ITEM_TEMPLATE_ID, toSiteRelativeHref } from '@/lib/location-nav-from-edge';

/** Home/Location — parent of the regional LocationItem pages. */
export const LOCATION_ROOT_ITEM_ID = '{6B97CC50-2F83-459A-B06C-D07D5F5D81CE}';

export type LocationDirectoryLink = {
  title: string;
  href: string;
  children: LocationDirectoryLink[];
};

export type LocationDirectoryGroup = {
  state: string;
  links: LocationDirectoryLink[];
};

type EdgeField = { value?: string };
type EdgeDirectoryItem = {
  id?: string;
  name?: string;
  displayName?: string;
  url?: { path?: string };
  state?: EdgeField;
  children?: { results?: EdgeDirectoryItem[] };
};

type DirectoryPage = {
  item?: {
    children?: {
      pageInfo?: { hasNext?: boolean; endCursor?: string };
      results?: EdgeDirectoryItem[];
    };
  };
};

const PAGE_SIZE = 15;

const STATE_LABELS: Record<string, string> = {
  ca: 'California',
  california: 'California',
  or: 'Oregon',
  oregon: 'Oregon',
  wa: 'Washington',
  washington: 'Washington',
};

const DIRECTORY_QUERY = `
  query LocationDirectoryPage($path: String!, $language: String!, $templateIds: [String!]!, $after: String) {
    item(path: $path, language: $language) {
      children(includeTemplateIDs: $templateIds, first: ${PAGE_SIZE}, after: $after) {
        pageInfo { hasNext endCursor }
        results {
          id
          name
          displayName
          url { path }
          state: field(name: "State") { value }
        }
      }
    }
  }
`;

export const stateLabel = (raw?: string): string => {
  const key = (raw || '').trim().toLowerCase();
  if (!key) return 'Other';
  return STATE_LABELS[key] || raw?.trim() || 'Other';
};

const toLink = (item: EdgeDirectoryItem): LocationDirectoryLink | null => {
  const href = toSiteRelativeHref(item.url?.path);
  const title = (item.displayName || item.name || '').trim();
  if (!href || !title) return null;
  return { title, href, children: [] };
};

export const groupLocationDirectory = (items: EdgeDirectoryItem[]): LocationDirectoryGroup[] => {
  const groups = new Map<string, LocationDirectoryLink[]>();

  items.forEach((item) => {
    const link = toLink(item);
    if (!link) return;
    const state = stateLabel(item.state?.value);
    const bucket = groups.get(state) ?? [];
    bucket.push(link);
    groups.set(state, bucket);
  });

  const order = ['California', 'Oregon', 'Washington'];
  return [...groups.entries()]
    .sort(([a], [b]) => {
      const aIndex = order.indexOf(a);
      const bIndex = order.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    })
    .map(([state, links]) => ({
      state,
      links: links.sort((a, b) => a.title.localeCompare(b.title)),
    }));
};

export async function fetchLocationDirectory(language = 'en'): Promise<LocationDirectoryGroup[]> {
  const items: EdgeDirectoryItem[] = [];
  let after = '';
  let hasNext = true;

  while (hasNext && items.length < 80) {
    const result = await client.getData<DirectoryPage>(DIRECTORY_QUERY, {
      path: LOCATION_ROOT_ITEM_ID,
      language,
      templateIds: [LOCATION_ITEM_TEMPLATE_ID],
      after,
    });
    const page = result?.item?.children;
    items.push(...(page?.results ?? []));
    hasNext = Boolean(page?.pageInfo?.hasNext && page.pageInfo.endCursor);
    after = page?.pageInfo?.endCursor || '';
    if (!page?.results?.length) break;
  }

  return groupLocationDirectory(items);
}
