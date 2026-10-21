import { NextResponse } from 'next/server';

const HOME_ID = 'A981C878-51AD-45EB-A6C0-68DFD91F5633';

type PublishedHit = {
  id?: string;
  name?: string;
  url?: { path?: string };
  pageTitle?: { value?: string };
  navigationTitle?: { value?: string };
  pageSummary?: { value?: string };
  metadataDescription?: { value?: string };
  updated?: { value?: string };
};

type SearchResponse = {
  data?: {
    search?: {
      pageInfo?: { hasNext?: boolean; endCursor?: string };
      results?: PublishedHit[];
    };
  };
  errors?: { message?: string }[];
};

const query = `query PublishedSearch($after: String) {
  search(
    where: {
      AND: [
        { name: "_path", value: "${HOME_ID}", operator: CONTAINS }
        { name: "_language", value: "en", operator: EQ }
        { name: "_hasLayout", value: "true", operator: EQ }
      ]
    }
    first: 25
    after: $after
  ) {
    pageInfo { hasNext endCursor }
    results {
      id
      name
      url { path }
      pageTitle: field(name: "pageTitle") { value }
      navigationTitle: field(name: "navigationTitle") { value }
      pageSummary: field(name: "pageSummary") { value }
      metadataDescription: field(name: "metadataDescription") { value }
      updated: field(name: "__Updated") { value }
    }
  }
}`;

export async function GET() {
  const contextId = process.env.SITECORE_EDGE_CONTEXT_ID || process.env.NEXT_PUBLIC_SITECORE_EDGE_CONTEXT_ID;
  if (!contextId) {
    return NextResponse.json({ results: [] }, { status: 500 });
  }

  const results: PublishedHit[] = [];
  let after: string | null = null;

  for (let page = 0; page < 8; page += 1) {
    const response = await fetch('https://edge-platform.sitecorecloud.io/v1/content/api/graphql/v1', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-sitecore-contextid': contextId,
      },
      body: JSON.stringify({ query, variables: after ? { after } : {} }),
    });

    if (!response.ok) return NextResponse.json({ results: [] }, { status: 502 });

    const payload = (await response.json()) as SearchResponse;
    if (payload.errors?.length) return NextResponse.json({ results: [] }, { status: 502 });

    results.push(...(payload.data?.search?.results ?? []));
    if (!payload.data?.search?.pageInfo?.hasNext) break;
    after = payload.data.search.pageInfo.endCursor || null;
    if (!after) break;
  }

  return NextResponse.json({ results });
}
