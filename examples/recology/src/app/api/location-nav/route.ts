import { NextRequest, NextResponse } from 'next/server';
import { fetchLocationNavFromEdge, type LocationNavResult } from '@/lib/location-nav-from-edge';

/** Demo cache so repeat header loads skip Experience Edge for this server process. */
const serverNavCache = new Map<string, LocationNavResult>();

export async function GET(request: NextRequest) {
  const itemId = request.nextUrl.searchParams.get('itemId')?.trim();
  const language = request.nextUrl.searchParams.get('language')?.trim() || 'en';

  if (!itemId) {
    return NextResponse.json({ error: 'itemId is required' }, { status: 400 });
  }

  const cacheKey = `${language}:${itemId.replace(/[{}]/g, '').toLowerCase()}`;
  const cached = serverNavCache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const nav = await fetchLocationNavFromEdge(itemId, language);
  if (!nav?.sections?.length) {
    return NextResponse.json(nav ?? { locationLabel: '', locationHref: '', sections: [] });
  }

  serverNavCache.set(cacheKey, nav);
  return NextResponse.json(nav);
}
