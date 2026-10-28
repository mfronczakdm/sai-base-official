import { NextRequest, NextResponse } from 'next/server';
import { fetchGlobalHeaderLinks } from '@/lib/global-header-links-from-edge';

export async function GET(request: NextRequest) {
  const language = request.nextUrl.searchParams.get('language')?.trim() || 'en';

  try {
    const links = await fetchGlobalHeaderLinks(language);
    return NextResponse.json({ links });
  } catch (error) {
    console.error('[global-header-links] failed:', error);
    return NextResponse.json({ links: [] });
  }
}
