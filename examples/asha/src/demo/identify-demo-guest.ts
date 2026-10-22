import type { DemoGuest } from '@/demo/demo-guests';

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
