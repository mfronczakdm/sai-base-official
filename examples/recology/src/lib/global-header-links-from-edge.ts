import client from '@/lib/sitecore-client';
import {
  GLOBAL_HEADER_LINK_LIST_PATH,
  parseGlobalHeaderLinks,
  type GlobalHeaderLink,
  type GlobalHeaderLinkEdgeItem,
} from '@/lib/global-header-links';

const GLOBAL_HEADER_LINKS_QUERY = `
  query GlobalHeaderLinks($path: String!, $language: String!) {
    item(path: $path, language: $language) {
      children(first: 20) {
        results {
          name
          link: field(name: "Link") {
            jsonValue
          }
        }
      }
    }
  }
`;

type GlobalHeaderLinksQueryResult = {
  item?: {
    children?: {
      results?: GlobalHeaderLinkEdgeItem[];
    };
  };
};

export const fetchGlobalHeaderLinks = async (language: string): Promise<GlobalHeaderLink[]> => {
  const result = await client.getData<GlobalHeaderLinksQueryResult>(GLOBAL_HEADER_LINKS_QUERY, {
    path: GLOBAL_HEADER_LINK_LIST_PATH,
    language,
  });

  return parseGlobalHeaderLinks(result?.item?.children?.results);
};
