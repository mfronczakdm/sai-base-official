import { DEMO_GUESTS, pinnedDemoGuests } from '@/demo/demo-guests';
import {
  appendVisitPath,
  clearStoredTrail,
  describeVisitLearning,
  forgetSitecoreBrowser,
  isDemoGuestPanelEnabled,
  pageLabel,
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

  it('pins four guests with different professions and campaigns', () => {
    const pinned = pinnedDemoGuests();

    expect(DEMO_GUESTS).toHaveLength(51);
    expect(pinned.map((guest) => guest.profession)).toEqual([
      'Speech-Language Pathologist',
      'Audiologist',
      'Student',
      'Speech-Language Pathologist',
    ]);
    expect(new Set(pinned.map((guest) => guest.seasonalCampaign)).size).toBe(3);

    const affinities = triggeredAffinities(pinned[1], ['/Events/The-ASHA-Convention']);
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
});
