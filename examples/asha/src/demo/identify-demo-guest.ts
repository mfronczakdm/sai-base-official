import type { DemoGuest } from '@/demo/demo-guests';

/** How long a profile switch waits for the identity event before the page reloads anyway. */
export const GUEST_IDENTITY_WAIT_MS = process.env.NODE_ENV === 'production' ? 1500 : 0;

/**
 * Binds this browser to an imported guest. The Profile Import API key stays on the server.
 * Cloud SDK events are initialized only on a deployed, non-preview site. In development the
 * SDK ready promise never settles, so this returns without calling it.
 */
export const identifyDemoGuest = async (guest: DemoGuest): Promise<void> => {
  if (process.env.NODE_ENV !== 'production') return;

  const { identity } = await import('@sitecore-content-sdk/events');

  await identity({
    channel: 'WEB',
    email: guest.email,
    firstName: guest.firstName,
    lastName: guest.lastName,
    identifiers: [{ id: guest.email, provider: 'email' }],
  });
};

/** Full document load with a unique URL so personalization cannot reuse the anonymous page. */
export const hardReloadPage = (): void => {
  const url = new URL(window.location.href);
  url.searchParams.set('guestReload', Date.now().toString());
  window.location.replace(url.toString());
};
