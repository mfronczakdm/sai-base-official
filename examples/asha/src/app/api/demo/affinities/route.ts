import { NextResponse } from 'next/server';
import { flattenAffinities } from '@/demo/guest-affinities';

const EDGE_ORIGIN = 'https://edge-platform.sitecorecloud.io';
// Live headless personalization. Its API response must return profile.traits.affinities.
const AFFINITY_FRIENDLY_ID = 'asha_guest_affinities';
const CLIENT_COOKIE = 'sc_cid';
const CLIENT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const clientIdFromCookie = (cookieHeader: string | null): string => {
  const pair = (cookieHeader ?? '')
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.toLowerCase().startsWith(`${CLIENT_COOKIE}=`));

  const value = pair ? decodeURIComponent(pair.slice(CLIENT_COOKIE.length + 1)) : '';
  return CLIENT_ID.test(value) ? value : '';
};

export async function GET(request: Request) {
  const clientId = clientIdFromCookie(request.headers.get('cookie'));
  const contextId =
    process.env.SITECORE_EDGE_CONTEXT_ID || process.env.NEXT_PUBLIC_SITECORE_EDGE_CONTEXT_ID;
  const siteId = process.env.NEXT_PUBLIC_DEFAULT_SITE_NAME;

  if (!clientId || !contextId || !siteId) {
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
          browserId: clientId,
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
