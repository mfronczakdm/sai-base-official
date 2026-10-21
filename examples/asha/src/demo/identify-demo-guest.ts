import type { DemoGuest } from '@/demo/demo-guests';

/**
 * Binds this browser to an imported guest. The Profile Import API key stays on the server.
 * Cloud SDK events are initialized only on a deployed, non-preview site.
 */
export const identifyDemoGuest = async (guest: DemoGuest): Promise<void> => {
  const { identity } = await import('@sitecore-content-sdk/events');

  await identity({
    channel: 'WEB',
    email: guest.email,
    firstName: guest.firstName,
    lastName: guest.lastName,
    identifiers: [{ id: guest.email, provider: 'email' }],
  });
};

export const reloadPage = (): void => {
  window.location.reload();
};
