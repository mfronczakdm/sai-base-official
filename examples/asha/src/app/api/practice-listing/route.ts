import { NextResponse } from 'next/server';
import {
  selectPracticeTopics,
  type PracticeSearchHit,
} from '@/components/uiim/practice-listing/practice-access.util';

const PRACTICE_MANAGEMENT_ID = 'AA38864D83BE4F0B9A6E0BB7509AF607';
const PRACTICE_PORTAL_TEMPLATE = 'A51E9057A33441A3A4F4049C3A218788';

type SearchResponse = {
  data?: {
    search?: {
      pageInfo?: { hasNext?: boolean; endCursor?: string };
      results?: PracticeSearchHit[];
    };
  };
  errors?: { message?: string }[];
};

const query = `query PracticeListing($after: String) {
  search(
    where: {
      AND: [
        { name: "_path", value: "${PRACTICE_MANAGEMENT_ID}", operator: CONTAINS }
        { name: "_templates", value: "${PRACTICE_PORTAL_TEMPLATE}", operator: CONTAINS }
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
      version
      pageTitle: field(name: "pageTitle") { value }
      navigationTitle: field(name: "navigationTitle") { value }
      pageSummary: field(name: "pageSummary") { value }
      access: field(name: "Access") { value }
    }
  }
}`;

export async function GET() {
  const contextId = process.env.SITECORE_EDGE_CONTEXT_ID || process.env.NEXT_PUBLIC_SITECORE_EDGE_CONTEXT_ID;
  if (!contextId) {
    return NextResponse.json({ topics: [] }, { status: 500 });
  }

  const hits: PracticeSearchHit[] = [];
  let after: string | null = null;

  for (let page = 0; page < 4; page += 1) {
    const response = await fetch('https://edge-platform.sitecorecloud.io/v1/content/api/graphql/v1', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-sitecore-contextid': contextId,
      },
      body: JSON.stringify({ query, variables: after ? { after } : {} }),
    });

    if (!response.ok) return NextResponse.json({ topics: [] }, { status: 502 });

    const payload = (await response.json()) as SearchResponse;
    if (payload.errors?.length) return NextResponse.json({ topics: [] }, { status: 502 });

    hits.push(...(payload.data?.search?.results ?? []));

    if (!payload.data?.search?.pageInfo?.hasNext) break;
    after = payload.data.search.pageInfo.endCursor || null;
    if (!after) break;
  }

  return NextResponse.json({ topics: selectPracticeTopics(hits) });
}
