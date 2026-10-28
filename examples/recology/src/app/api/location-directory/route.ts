import { NextRequest, NextResponse } from 'next/server';
import { fetchLocationDirectory, type LocationDirectoryGroup } from '@/lib/location-directory';

/** Demo cache so the all-locations panel does not re-walk Edge on every open. */
const directoryCache = new Map<string, LocationDirectoryGroup[]>();

export async function GET(request: NextRequest) {
  const language = request.nextUrl.searchParams.get('language')?.trim() || 'en';
  const cacheKey = `v2:${language}`;
  const cached = directoryCache.get(cacheKey);
  if (cached) {
    return NextResponse.json({ groups: cached });
  }

  try {
    const groups = await fetchLocationDirectory(language);
    if (groups.length) directoryCache.set(cacheKey, groups);
    return NextResponse.json({ groups });
  } catch (error) {
    console.error('[location-directory] failed:', error);
    return NextResponse.json({ groups: [] });
  }
}
