import { NextRequest, NextResponse } from 'next/server';
import { fetchLocationNavFromEdge } from '@/lib/location-nav-from-edge';

export async function GET(request: NextRequest) {
  const itemId = request.nextUrl.searchParams.get('itemId')?.trim();
  const language = request.nextUrl.searchParams.get('language')?.trim() || 'en';

  if (!itemId) {
    return NextResponse.json({ error: 'itemId is required' }, { status: 400 });
  }

  const nav = await fetchLocationNavFromEdge(itemId, language);
  if (!nav) {
    return NextResponse.json({ locationLabel: '', locationHref: '', sections: [] });
  }

  return NextResponse.json(nav);
}
