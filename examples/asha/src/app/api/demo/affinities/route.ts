import { NextResponse } from 'next/server';
import { PINNED_DEMO_GUEST_EMAILS } from '@/demo/demo-guests';
import { flattenAffinities } from '@/demo/guest-affinities';

const EDGE_ORIGIN = 'https://edge-platform.sitecorecloud.io';
// Live headless personalization. Its API response must return profile.traits.affinities.
const AFFINITY_FRIENDLY_ID = 'asha_guest_affinities';

const isPinnedGuest = (email: string): boolean =>
  (PINNED_DEMO_GUEST_EMAILS as readonly string[]).includes(email);

export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get('email')?.trim().toLowerCase() || '';

  if (!isPinnedGuest(email)) {
    return NextResponse.json({ affinities: [] }, { status: 400 });
  }

  const contextId =
    process.env.SITECORE_EDGE_CONTEXT_ID || process.env.NEXT_PUBLIC_SITECORE_EDGE_CONTEXT_ID;
  const siteId = process.env.NEXT_PUBLIC_DEFAULT_SITE_NAME;

  if (!contextId || !siteId) {
    return NextResponse.json({ affinities: [] });
  }

  const friendlyId = process.env.SITECORE_AFFINITY_FRIENDLY_ID || AFFINITY_FRIENDLY_ID;

  try {
    const response = await fetch(
      `${EDGE_ORIGIN}/v1/personalize/v2/callFlows?siteId=${encodeURIComponent(siteId)}`,
      {
        method: 'POST',
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-sitecore-contextid': contextId,
        },
        body: JSON.stringify({
          clientKey: '',
          channel: 'web',
          pointOfSale: siteId,
          email,
          friendlyId,
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json({ affinities: [] });
    }

    const payload: unknown = await response.json();
    return NextResponse.json({ affinities: flattenAffinities(payload) });
  } catch {
    return NextResponse.json({ affinities: [] });
  }
}
