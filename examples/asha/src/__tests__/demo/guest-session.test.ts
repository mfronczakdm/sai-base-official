import { DEMO_GUESTS, pinnedDemoGuests } from '@/demo/demo-guests';
import {
  appendVisitPath,
  clearGuestBound,
  clearStoredTrail,
  cookieHeaderWithoutBrowserId,
  describeVisitLearning,
  ensureAnonymousFirstLoad,
  forgetSitecoreBrowser,
  isDemoGuestPanelEnabled,
  markGuestBound,
  pageLabel,
  shouldPersonalizeAsAnonymous,
  triggeredAffinities,
  writeStoredTrail,
} from '@/demo/guest-session';

describe('guest session', () => {
  it('shows the panel for a demo flag, a session flag, or local development', () => {
    expect(isDemoGuestPanelEnabled('true', 'production', null)).toBe(true);
    expect(isDemoGuestPanelEnabled(undefined, 'production', '1')).toBe(true);
    expect(isDemoGuestPanelEnabled(undefined, 'development', null)).toBe(true);
    expect(isDemoGuestPanelEnabled(undefined, 'production', null)).toBe(false);
    expect(isDemoGuestPanelEnabled('true', 'development', '0')).toBe(false);
  });

  it('describes convention interest from the latest matching page', () => {
    const trail = appendVisitPath(['/'], '/Events/The-ASHA-Convention');

    expect(describeVisitLearning(trail)).toContain('convention interest');
    expect(pageLabel('/Events/The-ASHA-Convention')).toBe('The ASHA Convention');
  });

  it('pins the four selectable guest profiles', () => {
    const pinned = pinnedDemoGuests();

    expect(DEMO_GUESTS).toHaveLength(51);
    expect(pinned.map((guest) => `${guest.profession}|${guest.certificationStatus}`)).toEqual([
      'Student|Public',
      'Audiologist|Member-only',
      'Speech-Language Pathologist|Certificate holder',
      'Audiologist|Subscriber',
    ]);
    expect(pinned.map((guest) => guest.email)).toEqual([
      'julian.rossi.39@example.com',
      'lila.moreau.50@example.com',
      'nora.kim.09@example.com',
      'omar.haddad.26@example.com',
    ]);

    const affinities = triggeredAffinities(pinned[3], ['/Events/The-ASHA-Convention']);
    expect(affinities.map((affinity) => affinity.value)).toEqual([
      'Hearing Aids & Cochlear Implants',
      'convention interest',
    ]);
    expect(affinities[1].source).toBe('visit');
  });

  it('clears the stored visit and the Sitecore browser cookie', () => {
    writeStoredTrail(['/Events']);
    document.cookie = 'sc_cid=known-browser';

    clearStoredTrail();
    forgetSitecoreBrowser();

    expect(window.sessionStorage.getItem('asha-demo-visit-trail')).toBeNull();
    expect(document.cookie).not.toContain('sc_cid=known-browser');
  });

  it('starts a new session anonymous and keeps a guest only after one is chosen', () => {
    window.localStorage.setItem('asha-demo-guest-email', 'omar.haddad.26@example.com');

    ensureAnonymousFirstLoad();

    expect(window.localStorage.getItem('asha-demo-guest-email')).toBeNull();

    markGuestBound();
    window.localStorage.setItem('asha-demo-guest-email', 'julian.rossi.39@example.com');
    ensureAnonymousFirstLoad();

    expect(window.localStorage.getItem('asha-demo-guest-email')).toBe('julian.rossi.39@example.com');
    expect(document.cookie).toContain('asha-demo-guest-bound=1');

    clearGuestBound();
    expect(window.sessionStorage.getItem('asha-demo-guest-bound')).toBeNull();
  });

  it('drops the browser id until a demo guest is bound', () => {
    expect(shouldPersonalizeAsAnonymous(true, undefined)).toBe(true);
    expect(shouldPersonalizeAsAnonymous(true, '1')).toBe(false);
    expect(shouldPersonalizeAsAnonymous(false, undefined)).toBe(false);
    expect(cookieHeaderWithoutBrowserId('sc_cid=abc; other=1')).toBe('other=1');
  });
});
