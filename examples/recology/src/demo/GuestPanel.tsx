'use client';

import { useEffect, useState, type JSX } from 'react';
import { usePathname } from 'next/navigation';
import { useSitecore } from '@sitecore-content-sdk/nextjs';
import { cn } from '@/lib/utils';
import {
  findDemoGuest,
  guestDisplayName,
  pinnedDemoGuests,
  type DemoGuest,
} from '@/demo/demo-guests';
import {
  confirmPersonalizationReload,
  hardReloadPage,
  identifyDemoGuest,
} from '@/demo/identify-demo-guest';
import {
  DEMO_GUEST_BOUND_KEY,
  DEMO_GUEST_CHANGED_EVENT,
  DEMO_GUEST_STORAGE_KEY,
  DEMO_PANEL_STORAGE_KEY,
  PERSONALIZE_CONFIRM_DELAY_MS,
  PERSONALIZE_CONFIRM_KEY,
  appendVisitPath,
  clearGuestBound,
  clearPersonalizeConfirm,
  clearStoredTrail,
  describeVisitLearning,
  ensureAnonymousFirstLoad,
  forgetSitecoreBrowser,
  isDemoGuestPanelEnabled,
  markGuestBound,
  markPersonalizeConfirm,
  pageLabel,
  readStoredTrail,
  writeStoredTrail,
} from '@/demo/guest-session';

const Fact = ({ label, value }: { label: string; value?: string }) => (
  <div className="grid grid-cols-[8.5rem_1fr] gap-2 border-b border-border py-2 text-sm">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="min-w-0 text-foreground">{value || 'Not stored'}</dd>
  </div>
);

const CurrentProfile = ({ guest }: { guest?: DemoGuest }) => (
  <div data-testid="demo-guest-profile">
    <dl>
      <Fact label="Segment" value={guest?.segment || 'Not identified'} />
      <Fact label="Location" value={guest?.location || 'Not identified'} />
    </dl>
  </div>
);

const GuestChoice = ({
  guest,
  onSelect,
}: {
  guest: DemoGuest;
  onSelect: (guest: DemoGuest) => void;
}) => (
  <button
    type="button"
    className="w-full rounded-md border border-border px-3 py-2 text-left hover:border-primary"
    onClick={() => onSelect(guest)}
    data-testid={`demo-guest-choice-${guest.firstName.toLowerCase()}`}
  >
    <span className="block text-sm font-semibold text-foreground">{guestDisplayName(guest)}</span>
    <span className="mt-0.5 block text-xs text-muted-foreground">
      {guest.segment} · {guest.location}
    </span>
    <span className="mt-0.5 block text-xs text-primary">{guest.email}</span>
  </button>
);

const GuestPanel = (): JSX.Element | null => {
  ensureAnonymousFirstLoad();
  const pathname = usePathname();
  const { page } = useSitecore();
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [guestEmail, setGuestEmail] = useState<string | null>(null);
  const [trail, setTrail] = useState<string[]>([]);

  useEffect(() => {
    const readChosenGuest = () => {
      const email =
        window.sessionStorage.getItem(DEMO_GUEST_BOUND_KEY) === '1'
          ? window.localStorage.getItem(DEMO_GUEST_STORAGE_KEY)
          : null;
      setGuestEmail(email);
    };
    const optOutOfBfcache = () => undefined;
    const onPageShow = (event: PageTransitionEvent) => {
      readChosenGuest();
      if (event.persisted) hardReloadPage();
    };

    window.addEventListener('pageshow', onPageShow);
    window.addEventListener(DEMO_GUEST_CHANGED_EVENT, readChosenGuest);
    window.addEventListener('unload', optOutOfBfcache);
    return () => {
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener(DEMO_GUEST_CHANGED_EVENT, readChosenGuest);
      window.removeEventListener('unload', optOutOfBfcache);
    };
  }, []);

  useEffect(() => {
    if (window.sessionStorage.getItem(PERSONALIZE_CONFIRM_KEY) !== '1') return undefined;

    const timer = window.setTimeout(() => {
      if (window.sessionStorage.getItem(PERSONALIZE_CONFIRM_KEY) !== '1') return;
      clearPersonalizeConfirm();
      confirmPersonalizationReload();
    }, PERSONALIZE_CONFIRM_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('guestPanel');
    if (query === '1' || query === '0') {
      window.sessionStorage.setItem(DEMO_PANEL_STORAGE_KEY, query);
    }

    const enabled = isDemoGuestPanelEnabled(
      process.env.NEXT_PUBLIC_DEMO_GUEST_PANEL,
      process.env.NODE_ENV,
      window.sessionStorage.getItem(DEMO_PANEL_STORAGE_KEY)
    );

    if (!enabled || !page.mode.isNormal) {
      setVisible(false);
      return;
    }

    const email =
      window.sessionStorage.getItem(DEMO_GUEST_BOUND_KEY) === '1'
        ? window.localStorage.getItem(DEMO_GUEST_STORAGE_KEY)
        : null;
    const nextTrail = appendVisitPath(readStoredTrail(), pathname || '/');
    writeStoredTrail(nextTrail);
    setGuestEmail(email);
    setTrail(nextTrail);
    setVisible(true);
  }, [page.mode.isNormal, pathname]);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  if (!visible) return null;

  const guest = findDemoGuest(guestEmail);

  const selectGuest = (nextGuest: DemoGuest | null) => {
    const reloadForPersonalization = () => {
      window.dispatchEvent(new Event(DEMO_GUEST_CHANGED_EVENT));
      hardReloadPage();
    };

    if (nextGuest) {
      markGuestBound();
      markPersonalizeConfirm();
      window.localStorage.setItem(DEMO_GUEST_STORAGE_KEY, nextGuest.email);
      void identifyDemoGuest(nextGuest).finally(reloadForPersonalization);
      return;
    }

    clearGuestBound();
    clearPersonalizeConfirm();
    window.localStorage.removeItem(DEMO_GUEST_STORAGE_KEY);
    clearStoredTrail();
    forgetSitecoreBrowser();
    reloadForPersonalization();
  };

  return (
    <>
      {guest && !open ? (
        <div
          className="fixed right-4 bottom-20 z-[60] w-[20rem] max-w-[calc(100vw-2rem)] rounded-md border border-primary bg-background px-4 py-3 text-sm text-foreground shadow-lg"
          data-testid="demo-guest-banner"
        >
          <p className="mb-2 text-sm font-semibold">{guestDisplayName(guest)}</p>
          <CurrentProfile guest={guest} />
          <button
            type="button"
            className="mt-3 text-sm font-semibold text-primary underline"
            data-testid="demo-guest-logout"
            onClick={() => selectGuest(null)}
          >
            Log out to anonymous
          </button>
        </div>
      ) : null}

      <button
        type="button"
        className={cn(
          'fixed right-0 z-[60] rounded-l-md bg-primary px-3 py-3 text-sm font-semibold text-primary-foreground shadow-lg',
          guest && !open ? 'bottom-6' : 'top-1/2 -translate-y-1/2'
        )}
        aria-expanded={open}
        data-testid="demo-guest-tab"
        onClick={() => setOpen((current) => !current)}
      >
        {guest ? guest.firstName : 'Recology Guest'}
      </button>

      {open ? (
        <aside
          className="fixed top-0 right-0 z-[70] flex h-full w-[24rem] max-w-full flex-col overflow-y-auto bg-background px-5 py-6 text-foreground shadow-2xl"
          role="dialog"
          aria-label="Recology Guest panel"
          data-testid="demo-guest-panel"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-wide text-primary uppercase">Demo guest</p>
              <h2 className="mt-1 text-xl font-semibold">Recology Guest</h2>
            </div>
            <button type="button" className="text-sm text-primary" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>

          <section className="mt-6">
            <h3 className="text-sm font-semibold">Current profile</h3>
            <div className="mt-2">
              <CurrentProfile guest={guest} />
            </div>
          </section>

          <section className="mt-6">
            <h3 className="text-sm font-semibold">Who this browser is</h3>
            {guest ? (
              <p className="mt-2 text-sm">
                {guestDisplayName(guest)} ({guest.email}). Segment: {guest.segment}. Location:{' '}
                {guest.location}.
              </p>
            ) : (
              <p className="mt-2 text-sm">
                Anonymous. Sitecore has this browser, and it does not yet have a known guest.
              </p>
            )}
            {guest ? (
              <button
                type="button"
                className="mt-3 text-sm font-semibold text-primary underline"
                data-testid="demo-guest-logout"
                onClick={() => selectGuest(null)}
              >
                Log out to anonymous
              </button>
            ) : null}
          </section>

          <section className="mt-6">
            <h3 className="text-sm font-semibold">What Sitecore already believes</h3>
            {guest ? (
              <dl className="mt-2">
                <Fact label="Segment" value={guest.segment} />
                <Fact label="Location" value={guest.location} />
                <Fact label="Primary interest" value={guest.primaryInterest} />
                <Fact label="Campaign" value={guest.seasonalCampaign} />
                <Fact label="Engagement" value={guest.engagementLevel} />
                <Fact label="Next action" value={guest.nextBestAction} />
              </dl>
            ) : (
              <p className="mt-2 text-sm">
                No imported profile is attached yet. Choose a known guest to load Segment, Location,
                and next action.
              </p>
            )}
          </section>

          <section className="mt-6">
            <h3 className="text-sm font-semibold">What this visit just taught it</h3>
            <p className="mt-2 text-sm" data-testid="demo-guest-learning">
              {describeVisitLearning(trail)}
            </p>
            {trail.length ? (
              <ol className="mt-3 space-y-1 text-xs text-muted-foreground">
                {trail.map((path) => (
                  <li key={path}>{pageLabel(path)}</li>
                ))}
              </ol>
            ) : null}
          </section>

          <section className="mt-6">
            <h3 className="text-sm font-semibold">Switch known guest</h3>
            <div className="mt-3 space-y-2">
              {pinnedDemoGuests().map((choice) => (
                <GuestChoice key={choice.email} guest={choice} onSelect={selectGuest} />
              ))}
            </div>
          </section>

          {process.env.NODE_ENV === 'development' ? (
            <p className="mt-6 text-xs text-muted-foreground">
              On localhost the Cloud SDK stays off, so this browser remembers the guest locally and
              reloads the full page after a choice. The first visit stays anonymous. On the deployed
              site, choosing a guest sends an identity event for that email and reloads so
              personalization uses that profile.
            </p>
          ) : (
            <p className="mt-6 text-xs text-muted-foreground">
              Choosing a guest sends an identity event for that email, then loads the page again so
              personalization uses that profile. The first visit stays anonymous. Log out clears
              that browser and loads the anonymous page.
            </p>
          )}
        </aside>
      ) : null}
    </>
  );
};

export default GuestPanel;
