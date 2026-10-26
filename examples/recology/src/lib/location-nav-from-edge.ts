import scConfig from 'sitecore.config';
import client from '@/lib/sitecore-client';

/** LocationItem template — without braces for Edge includeTemplateIDs */
export const LOCATION_ITEM_TEMPLATE_ID = 'f38af42cac5c41ac9e7a5bfa2def4e66';

const MAX_CHILDREN = 30;

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

type EdgeNavItem = {
  id?: string;
  name?: string;
  displayName?: string;
  template?: { id?: string; name?: string };
  url?: { path?: string };
  children?: { results?: EdgeNavItem[] };
};

type LocationNavQueryResult = {
  item?: EdgeNavItem & {
    ancestors?: EdgeNavItem[];
  };
};

const normalizeTemplateId = (id?: string) =>
  (id || '').replace(/[{}-]/g, '').toLowerCase();

const isLocationItem = (item?: EdgeNavItem | null) =>
  normalizeTemplateId(item?.template?.id) === LOCATION_ITEM_TEMPLATE_ID ||
  item?.template?.name === 'LocationItem';

const toLink = (item: EdgeNavItem): LocationNavLink | null => {
  const href = item.url?.path?.trim();
  if (!href) return null;
  const title = (item.displayName || item.name || '').trim();
  if (!title) return null;
  return { name: item.name || title, title, href };
};

const mapSections = (location: EdgeNavItem): LocationNavSection[] =>
  (location.children?.results ?? [])
    .map((child) => {
      const link = toLink(child);
      if (!link) return null;
      const children = (child.children?.results ?? [])
        .map((grand) => toLink(grand))
        .filter((entry): entry is LocationNavLink => Boolean(entry));
      return { ...link, children };
    })
    .filter((section): section is LocationNavSection => Boolean(section));

const LOCATION_NAV_QUERY = `
  query LocationNav($path: String!, $language: String!, $locationTemplateId: String!) {
    item(path: $path, language: $language) {
      id
      name
      displayName
      template { id name }
      url { path }
      children(hasLayout: true, first: ${MAX_CHILDREN}) {
        results {
          id
          name
          displayName
          template { id name }
          url { path }
          children(hasLayout: true, first: ${MAX_CHILDREN}) {
            results {
              id
              name
              displayName
              url { path }
            }
          }
        }
      }
      ancestors(includeTemplateIDs: $locationTemplateId) {
        id
        name
        displayName
        template { id name }
        url { path }
        children(hasLayout: true, first: ${MAX_CHILDREN}) {
          results {
            id
            name
            displayName
            template { id name }
            url { path }
            children(hasLayout: true, first: ${MAX_CHILDREN}) {
              results {
                id
                name
                displayName
                url { path }
              }
            }
          }
        }
      }
    }
  }
`;

function resolveLocationRoot(item?: LocationNavQueryResult['item']): EdgeNavItem | null {
  if (!item) return null;
  if (isLocationItem(item)) return item;
  const match = (item.ancestors ?? []).find((ancestor) => isLocationItem(ancestor));
  return match || null;
}

/**
 * Resolve regional location nav from the current page item id or path.
 * Walks up to the nearest LocationItem, then returns its layout children
 * (All Services, Customer Service, …) and their children for dropdowns.
 */
export async function fetchLocationNavFromEdge(
  itemIdOrPath: string,
  language = scConfig.defaultLanguage || 'en'
): Promise<LocationNavResult | null> {
  const path = itemIdOrPath?.trim();
  if (!path) return null;

  try {
    const result = await client.getData<LocationNavQueryResult>(LOCATION_NAV_QUERY, {
      path,
      language,
      locationTemplateId: LOCATION_ITEM_TEMPLATE_ID,
    });

    const location = resolveLocationRoot(result?.item);
    if (!location) return null;

    const locationLink = toLink(location);
    return {
      locationLabel: locationLink?.title || location.displayName || location.name || '',
      locationHref: locationLink?.href || '/',
      sections: mapSections(location),
    };
  } catch (error) {
    console.error('[fetchLocationNavFromEdge] GraphQL request failed:', error);
    return null;
  }
}
