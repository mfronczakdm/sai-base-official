import type { DemoGuest } from '@/demo/demo-guests';

const EDGE_ORIGIN = 'https://edge-platform.sitecorecloud.io';
const CLIENT_COOKIE = 'sc_cid';
const CLIENT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Personalization reloads even if the identity call never returns. */
export const IDENTIFY_BEFORE_RELOAD_MS = 2000;

const readClientId = (): string => {
  if (typeof document === 'undefined') return '';

  const pair = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.toLowerCase().startsWith(`${CLIENT_COOKIE}=`));
  const value = pair ? decodeURIComponent(pair.slice(CLIENT_COOKIE.length + 1)) : '';

  return CLIENT_ID.test(value) ? value : '';
};

const writeClientId = (clientId: string): void => {
  const maxAge = 730 * 24 * 60 * 60;
  document.cookie = `${CLIENT_COOKIE}=${clientId}; Path=/; SameSite=Lax; Max-Age=${maxAge}`;
};

const contextId = (): string => process.env.NEXT_PUBLIC_SITECORE_EDGE_CONTEXT_ID || '';

const ensureClientId = async (): Promise<string> => {
  const existing = readClientId();
  if (existing) return existing;

  const edgeContextId = contextId();
  if (!edgeContextId) return '';

  const response = await fetch(`${EDGE_ORIGIN}/v1/events/v1.2/browser/create.json?client_key=`, {
    headers: {
      Accept: 'application/json',
      'x-sitecore-contextid': edgeContextId,
    },
  });
  if (!response.ok) return '';

  const payload = (await response.json()) as { ref?: string };
  const created = payload.ref && CLIENT_ID.test(payload.ref) ? payload.ref : '';
  if (created) writeClientId(created);

  return created;
};

const sendIdentity = async (guest: DemoGuest): Promise<void> => {
  const edgeContextId = contextId();
  const browserId = await ensureClientId();
  if (!edgeContextId || !browserId) return;

  const siteId = process.env.NEXT_PUBLIC_DEFAULT_SITE_NAME || 'asha';

  await fetch(`${EDGE_ORIGIN}/v1/events/v1.2/events?siteId=${encodeURIComponent(siteId)}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-sitecore-contextid': edgeContextId,
    },
    body: JSON.stringify({
      type: 'IDENTITY',
      browser_id: browserId,
      channel: 'WEB',
      currency: 'USD',
      language: 'EN',
      page: typeof document === 'undefined' ? 'home' : document.title || 'home',
      client_key: '',
      pos: '',
      requested_at: new Date().toISOString(),
      email: guest.email,
      firstname: guest.firstName,
      lastname: guest.lastName,
      identifiers: [{ id: guest.email, provider: 'email' }],
    }),
  });
};

/**
 * Binds this browser to an imported guest before the page reloads for personalization.
 * The event is sent on the existing sc_cid so Sitecore personalizes that same visitor.
 */
export const identifyDemoGuest = async (guest: DemoGuest): Promise<void> => {
  await Promise.race([
    sendIdentity(guest).catch(() => undefined),
    new Promise((resolve) => {
      setTimeout(resolve, IDENTIFY_BEFORE_RELOAD_MS);
    }),
  ]);
};

/**
 * Full document load. A form GET is a real navigation: location.replace is ignored on the
 * second profile switch after history.replaceState cleans the previous cache-busting URL.
 */
export const hardReloadPage = (): void => {
  const url = new URL(window.location.href);
  url.searchParams.set('guestReload', Date.now().toString());

  const form = document.createElement('form');
  form.method = 'GET';
  form.action = url.pathname;
  url.searchParams.forEach((value, key) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
};

/**
 * Same request a manual refresh sends. The load right after identity still gets the
 * default variant; this follow-up is the one Sitecore personalizes.
 */
export const confirmPersonalizationReload = (): void => {
  window.location.reload();
};
