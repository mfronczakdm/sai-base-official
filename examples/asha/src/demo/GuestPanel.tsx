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
import { formatAffinityScore, type ScoredAffinity } from '@/demo/guest-affinities';
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
  <div className="grid grid-cols-[8.5rem_1fr] gap-2 border-b border-[#e7e2d8] py-2 text-sm">
    <dt className="text-[#5c6b70]">{label}</dt>
    <dd className="min-w-0 text-[#16323a]">{value || 'Not stored'}</dd>
  </div>
);

const AffinityScores = ({
  affinities,
  status,
}: {
  affinities: ScoredAffinity[];
  status: 'idle' | 'loading' | 'ready';
}) => (
  <div className="mt-3" data-testid="demo-guest-affinities">
    <p className="text-sm font-semibold">Top affinities</p>
    {affinities.length ? (
      <table className="mt-2 w-full text-left text-sm">
        <thead>
          <tr className="text-xs text-[#5c6b70]">
            <th className="py-1 font-semibold">Affinity</th>
            <th className="py-1 font-semibold">Views</th>
            <th className="py-1 text-right font-semibold">Score</th>
          </tr>
        </thead>
        <tbody>
          {affinities.map((affinity) => (
            <tr key={`${affinity.name}:${affinity.value}`} className="border-t border-[#e7e2d8]">
              <td className="py-2 pr-2">
                <div className="text-xs text-[#5c6b70]">{affinity.name}</div>
                <div className="text-[#16323a]">{affinity.value}</div>
              </td>
              <td className="py-2">{affinity.views}</td>
              <td className="py-2 text-right">{formatAffinityScore(affinity.score)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <p className="mt-1 text-sm text-[#5c6b70]">
        {status === 'loading'
          ? 'Reading Sitecore affinity scores…'
          : 'Sitecore has not returned affinity scores for this profile yet.'}
      </p>
    )}
  </div>
);

const CurrentProfile = ({
  guest,
  affinities,
  affinityStatus,
}: {
  guest?: DemoGuest;
  affinities: ScoredAffinity[];
  affinityStatus: 'idle' | 'loading' | 'ready';
}) => (
  <div data-testid="demo-guest-profile">
    <dl>
      <Fact label="Profession" value={guest?.profession || 'Not identified'} />
      <Fact label="Certification" value={guest?.certificationStatus || 'Not identified'} />
    </dl>
    <AffinityScores affinities={affinities} status={affinityStatus} />
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
    className="w-full rounded-md border border-[#d7e3e6] px-3 py-2 text-left hover:border-[#00778B]"
    onClick={() => onSelect(guest)}
  >
    <span className="block text-sm font-semibold text-[#16323a]">{guestDisplayName(guest)}</span>
    <span className="mt-0.5 block text-xs text-[#5c6b70]">
      {guest.profession} · {guest.certificationStatus}
    </span>
    <span className="mt-0.5 block text-xs text-[#00778B]">{guest.seasonalCampaign}</span>
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
  const [scoredAffinities, setScoredAffinities] = useState<ScoredAffinity[]>([]);
  const [affinityStatus, setAffinityStatus] = useState<'idle' | 'loading' | 'ready'>('idle');

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
    if (!visible) {
      return undefined;
    }

    const controller = new AbortController();

    const loadScores = () => {
      setAffinityStatus('loading');
      fetch('/api/demo/affinities', {
        cache: 'no-store',
        credentials: 'same-origin',
        signal: controller.signal,
      })
        .then((response) => (response.ok ? response.json() : { affinities: [] }))
        .then((payload: { affinities?: ScoredAffinity[] }) => {
          setScoredAffinities(Array.isArray(payload.affinities) ? payload.affinities : []);
          setAffinityStatus('ready');
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') return;
          setScoredAffinities([]);
          setAffinityStatus('ready');
        });
    };

    loadScores();
    const retry = window.setTimeout(loadScores, 1500);

    return () => {
      controller.abort();
      window.clearTimeout(retry);
    };
  }, [pathname, visible]);

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
      {(guest || scoredAffinities.length > 0) && !open ? (
        <div
          className="fixed right-4 bottom-20 z-[60] w-[20rem] max-w-[calc(100vw-2rem)] rounded-md border border-[#00778B] bg-white px-4 py-3 text-sm text-[#16323a] shadow-lg"
          data-testid="demo-guest-banner"
        >
          <p className="mb-2 text-sm font-semibold">{guest ? guestDisplayName(guest) : 'Visitor'}</p>
          <CurrentProfile
            guest={guest}
            affinities={scoredAffinities}
            affinityStatus={affinityStatus}
          />
          {guest ? (
            <button
              type="button"
              className="mt-3 text-sm font-semibold text-[#00778B] underline"
              data-testid="demo-guest-logout"
              onClick={() => selectGuest(null)}
            >
              Log out to anonymous
            </button>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        className={cn(
          'fixed right-0 z-[60] rounded-l-md bg-[#00778B] px-3 py-3 text-sm font-semibold text-white shadow-lg',
          guest && !open ? 'bottom-6' : 'top-1/2 -translate-y-1/2'
        )}
        aria-expanded={open}
        data-testid="demo-guest-tab"
        onClick={() => setOpen((current) => !current)}
      >
        {guest ? guest.firstName : 'Guest'}
      </button>

      {open ? (
        <aside
          className="fixed top-0 right-0 z-[70] flex h-full w-[24rem] max-w-full flex-col overflow-y-auto bg-white px-5 py-6 text-[#16323a] shadow-2xl"
          role="dialog"
          aria-label="Guest panel"
          data-testid="demo-guest-panel"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-wide text-[#00778B] uppercase">
                Demo guest
              </p>
              <h2 className="mt-1 text-xl font-semibold">Tealium Data Shared with Sitecore</h2>
            </div>
            <button type="button" className="text-sm text-[#00778B]" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>

          <section className="mt-6">
            <h3 className="text-sm font-semibold">Current profile</h3>
            <div className="mt-2">
              <CurrentProfile
              guest={guest}
              affinities={scoredAffinities}
              affinityStatus={affinityStatus}
            />
            </div>
          </section>

          <section className="mt-6">
            <h3 className="text-sm font-semibold">Who this browser is</h3>
            {guest ? (
              <p className="mt-2 text-sm">
                {guestDisplayName(guest)}, {guest.profession}. Certification status:{' '}
                {guest.certificationStatus}.
              </p>
            ) : (
              <p className="mt-2 text-sm">
                Anonymous. Sitecore has this browser, and it does not yet have a known guest.
              </p>
            )}
            {guest ? (
              <button
                type="button"
                className="mt-3 text-sm font-semibold text-[#00778B] underline"
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
                <Fact label="Profession" value={guest.profession} />
                <Fact label="Certification" value={guest.certificationStatus} />
                <Fact label="Caseload" value={guest.caseloadSize} />
                <Fact label="Primary interest" value={guest.primaryInterest} />
                <Fact label="Campaign" value={guest.seasonalCampaign} />
                <Fact label="Engagement" value={guest.engagementLevel} />
                <Fact label="Next action" value={guest.nextBestAction} />
              </dl>
            ) : (
              <p className="mt-2 text-sm">
                No imported profile is attached yet. Choose a known guest to load profession,
                interest, campaign, and next action.
              </p>
            )}
          </section>

          <section className="mt-6">
            <h3 className="text-sm font-semibold">What this visit just taught it</h3>
            <p className="mt-2 text-sm" data-testid="demo-guest-learning">
              {describeVisitLearning(trail)}
            </p>
            {trail.length ? (
              <ol className="mt-3 space-y-1 text-xs text-[#5c6b70]">
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
                <GuestChoice
                  key={choice.email}
                  guest={choice}
                  onSelect={selectGuest}
                />
              ))}
            </div>
          </section>

          {process.env.NODE_ENV === 'development' ? (
            <p className="mt-6 text-xs text-[#5c6b70]">
              On localhost the Cloud SDK stays off, so this browser remembers the guest locally and
              reloads the full page after a choice. The first visit stays anonymous. On the deployed
              site, choosing a guest sends an identity event for that email and reloads so
              personalization uses that profile.
            </p>
          ) : (
            <p className="mt-6 text-xs text-[#5c6b70]">
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
