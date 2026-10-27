import scConfig from 'sitecore.config';
import client from '@/lib/sitecore-client';

/** LocationItem template — without braces for Edge includeTemplateIDs */
export const LOCATION_ITEM_TEMPLATE_ID = 'f38af42cac5c41ac9e7a5bfa2def4e66';

/** Preferred L1 order matching Recology location headers (e.g. American Canyon). */
export const LOCATION_NAV_SECTION_ORDER = [
  'Customer Service',
  'All Services',
  'In My Community',
  'Helpful Resources',
  'Nearby Locations',
] as const;

const MAX_CHILDREN = 20;

export type LocationNavLink = {
  name: string;
  title: string;
  href: string;
};

export type LocationNavSection = LocationNavLink & {
  children: LocationNavLink[];
};

export type LocationNavResult = {
  locationLabel: string;
  locationHref: string;
  sections: LocationNavSection[];
};

type EdgeField = { value?: string; jsonValue?: { value?: string } };

type EdgeNavItem = {
  id?: string;
  name?: string;
  displayName?: string;
  template?: { id?: string; name?: string };
  url?: { path?: string };
  title?: EdgeField;
  navigationTitle?: EdgeField;
  children?: { results?: EdgeNavItem[] };
};

type LocationResolveQueryResult = {
  item?: EdgeNavItem & {
    ancestors?: EdgeNavItem[];
  };
};

type LocationChildrenQueryResult = {
  item?: EdgeNavItem;
};

const normalizeTemplateId = (id?: string) =>
  (id || '').replace(/[{}-]/g, '').toLowerCase();

const isLocationItem = (item?: EdgeNavItem | null) =>
  normalizeTemplateId(item?.template?.id) === LOCATION_ITEM_TEMPLATE_ID ||
  item?.template?.name === 'LocationItem';

const readFieldText = (field?: EdgeField) =>
  (field?.value || field?.jsonValue?.value || '').trim();

const readTitle = (item: EdgeNavItem): string =>
  (
    readFieldText(item.title) ||
    readFieldText(item.navigationTitle) ||
    item.displayName ||
    item.name ||
    ''
  ).trim();

const toLink = (item: EdgeNavItem): LocationNavLink | null => {
  const href = item.url?.path?.trim();
  if (!href) return null;
  const title = readTitle(item);
  if (!title) return null;
  return { name: item.name || title, title, href };
};

const sectionSortKey = (title: string) => {
  const index = LOCATION_NAV_SECTION_ORDER.findIndex(
    (name) => name.toLowerCase() === title.toLowerCase()
  );
  return index === -1 ? LOCATION_NAV_SECTION_ORDER.length + 1 : index;
};

const isKnownSectionTitle = (title: string) =>
  LOCATION_NAV_SECTION_ORDER.some((name) => name.toLowerCase() === title.toLowerCase());

/** Resolve the nearest LocationItem id (current item or ancestor). Kept shallow for Edge complexity limits. */
const LOCATION_RESOLVE_QUERY = `
  query LocationNavResolve($path: String!, $language: String!, $locationTemplateIds: [String!]!) {
    item(path: $path, language: $language) {
      id
      name
      displayName
      template { id name }
      url { path }
      title: field(name: "Title") { jsonValue }
      navigationTitle: field(name: "navigationTitle") { jsonValue }
      ancestors(includeTemplateIDs: $locationTemplateIds) {
        id
        name
        displayName
        template { id name }
        url { path }
        title: field(name: "Title") { jsonValue }
        navigationTitle: field(name: "navigationTitle") { jsonValue }
      }
    }
  }
`;

/** One level of layout children only — nested children exceed Experience Edge complexity. */
const LOCATION_L1_QUERY = `
  query LocationNavL1($path: String!, $language: String!) {
    item(path: $path, language: $language) {
      id
      name
      displayName
      url { path }
      title: field(name: "Title") { jsonValue }
      navigationTitle: field(name: "navigationTitle") { jsonValue }
      children(hasLayout: true, first: ${MAX_CHILDREN}) {
        results {
          id
          name
          displayName
          url { path }
          title: field(name: "Title") { jsonValue }
          navigationTitle: field(name: "navigationTitle") { jsonValue }
        }
      }
    }
  }
`;

const LOCATION_L2_QUERY = `
  query LocationNavL2($path: String!, $language: String!) {
    item(path: $path, language: $language) {
      id
      children(hasLayout: true, first: ${MAX_CHILDREN}) {
        results {
          id
          name
          displayName
          url { path }
          title: field(name: "Title") { jsonValue }
          navigationTitle: field(name: "navigationTitle") { jsonValue }
        }
      }
    }
  }
`;

function resolveLocationRoot(item?: LocationResolveQueryResult['item']): EdgeNavItem | null {
  if (!item) return null;
  if (isLocationItem(item)) return item;
  const match = (item.ancestors ?? []).find((ancestor) => isLocationItem(ancestor));
  return match || null;
}

function normalizeItemId(itemIdOrPath: string): string {
  const trimmed = itemIdOrPath.trim();
  if (/^[0-9a-fA-F-]{36}$/.test(trimmed)) {
    return `{${trimmed}}`;
  }
  return trimmed;
}

async function fetchSectionChildren(
  sectionId: string,
  language: string
): Promise<LocationNavLink[]> {
  try {
    const result = await client.getData<LocationChildrenQueryResult>(LOCATION_L2_QUERY, {
      path: normalizeItemId(sectionId),
      language,
    });
    return (result?.item?.children?.results ?? [])
      .map((child) => toLink(child))
      .filter((entry): entry is LocationNavLink => Boolean(entry));
  } catch (error) {
    console.error('[fetchLocationNavFromEdge] L2 query failed:', error);
    return [];
  }
}

/**
 * Resolve regional location nav from the current page item id, LocationItem id, or path.
 * Walks up to the nearest LocationItem, then returns its layout children
 * (Customer Service, All Services, …) and their children for dropdowns.
 */
export async function fetchLocationNavFromEdge(
  itemIdOrPath: string,
  language = scConfig.defaultLanguage || 'en'
): Promise<LocationNavResult | null> {
  const path = normalizeItemId(itemIdOrPath);
  if (!path) return null;

  try {
    const resolved = await client.getData<LocationResolveQueryResult>(LOCATION_RESOLVE_QUERY, {
      path,
      language,
      locationTemplateIds: [LOCATION_ITEM_TEMPLATE_ID],
    });

    const locationRoot = resolveLocationRoot(resolved?.item);
    if (!locationRoot?.id) return null;

    const locationPath = normalizeItemId(locationRoot.id);
    const l1Result = await client.getData<LocationChildrenQueryResult>(LOCATION_L1_QUERY, {
      path: locationPath,
      language,
    });

    const location = l1Result?.item || locationRoot;
    const locationLink = toLink(location);
    const l1Items = (location.children?.results ?? [])
      .map((child) => {
        const link = toLink(child);
        if (!link || !child.id || !isKnownSectionTitle(link.title)) return null;
        return { ...link, id: child.id };
      })
      .filter((entry): entry is LocationNavLink & { id: string } => Boolean(entry))
      .sort((a, b) => sectionSortKey(a.title) - sectionSortKey(b.title) || a.title.localeCompare(b.title));

    const sections: LocationNavSection[] = await Promise.all(
      l1Items.map(async (section) => ({
        name: section.name,
        title: section.title,
        href: section.href,
        children: await fetchSectionChildren(section.id, language),
      }))
    );

    return {
      locationLabel: locationLink?.title || readTitle(location) || '',
      locationHref: locationLink?.href || '/',
      sections,
    };
  } catch (error) {
    console.error('[fetchLocationNavFromEdge] GraphQL request failed:', error);
    return null;
  }
}
