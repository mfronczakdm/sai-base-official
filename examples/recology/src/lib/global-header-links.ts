/** Link List under Global Header Recology / Data / Main */
export const GLOBAL_HEADER_LINK_LIST_PATH =
  '/sitecore/content/recology/recology/Presentation/Partial Designs/Global/Global Header Recology/Data/Main';

/** Screenshot order. Extra links the author adds keep their Sitecore order after these. */
export const GLOBAL_HEADER_LINK_ORDER = [
  'About Us',
  'Community Impact',
  'Sustainability',
  'Organics',
  'Careers',
] as const;

const KNOWN_PAGE_HREFS: Record<string, string> = {
  d9e7b1478800415aa40e28f5d790c9f9: '/About-Us',
  d226b4e64cf04185bf8c675e20ce8576: '/Community-Impact',
  be481733efc04d6092d6cf65057f0164: '/Sustainability',
  '00204a3d55d3479589c99bdb653768f5': '/Organics',
  '265e8c96383b48868ae4ad313a43caf3': '/Careers',
};

export type GlobalHeaderLink = {
  text: string;
  href: string;
};

export const GLOBAL_HEADER_LINK_FALLBACK: GlobalHeaderLink[] = [
  { text: 'About Us', href: '/About-Us' },
  { text: 'Community Impact', href: '/Community-Impact' },
  { text: 'Sustainability', href: '/Sustainability' },
  { text: 'Organics', href: '/Organics' },
  { text: 'Careers', href: '/Careers' },
];

type LinkJson = {
  href?: string;
  url?: string;
  text?: string;
  id?: string;
};

export type GlobalHeaderLinkEdgeItem = {
  name?: string;
  link?: {
    jsonValue?: { value?: LinkJson } | LinkJson;
  };
};

const normalizeId = (id?: string) => (id || '').replace(/[{}-]/g, '').toLowerCase();

/** Edge link hrefs are often host-qualified. Keep the site path so the header stays on this site. */
const toSiteRelativeHref = (raw?: string): string => {
  const href = (raw || '').trim();
  if (!href) return '';

  let path = href;
  if (href.startsWith('//') || /^https?:\/\//i.test(href)) {
    try {
      path = new URL(href.startsWith('//') ? `https:${href}` : href).pathname;
    } catch {
      path = href;
    }
  }

  const normalized = path.replace(/\/{2,}/g, '/');
  if (!normalized) return '';
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
};

const readLinkValue = (item: GlobalHeaderLinkEdgeItem): LinkJson => {
  const json = item.link?.jsonValue;
  if (!json) return {};
  if ('value' in json && json.value) return json.value;
  return json as LinkJson;
};

const orderIndex = (text: string) => {
  const index = GLOBAL_HEADER_LINK_ORDER.findIndex(
    (name) => name.toLowerCase() === text.toLowerCase()
  );
  return index === -1 ? GLOBAL_HEADER_LINK_ORDER.length : index;
};

export const parseGlobalHeaderLinks = (
  items: GlobalHeaderLinkEdgeItem[] | undefined
): GlobalHeaderLink[] => {
  const links = (items ?? [])
    .map((item) => {
      const value = readLinkValue(item);
      const text = (value.text || item.name || '').trim();
      const href =
        toSiteRelativeHref(value.href || value.url) ||
        KNOWN_PAGE_HREFS[normalizeId(value.id)] ||
        '';
      if (!text || !href) return null;
      return { text, href };
    })
    .filter((link): link is GlobalHeaderLink => Boolean(link));

  return links
    .map((link, index) => ({ link, index }))
    .sort((left, right) => {
      const order = orderIndex(left.link.text) - orderIndex(right.link.text);
      return order === 0 ? left.index - right.index : order;
    })
    .map((entry) => entry.link);
};
