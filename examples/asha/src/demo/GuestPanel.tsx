'use client';

import { useEffect, useState, type JSX } from 'react';
import { usePathname } from 'next/navigation';
import { useSitecore } from '@sitecore-content-sdk/nextjs';
import { cn } from '@/lib/utils';
import {
  findDemoGuest,
  guestDisplayName,
  moreDemoGuests,
  pinnedDemoGuests,
  type DemoGuest,
} from '@/demo/demo-guests';
import { identifyDemoGuest, reloadPage } from '@/demo/identify-demo-guest';
import {
  DEMO_GUEST_STORAGE_KEY,
  DEMO_PANEL_STORAGE_KEY,
  appendVisitPath,
  describeVisitLearning,
  guestPageLine,
  isDemoGuestPanelEnabled,
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

const GuestChoice = ({
  guest,
  pending,
  onSelect,
}: {
  guest: DemoGuest;
  pending: boolean;
  onSelect: (guest: DemoGuest) => void;
}) => (
  <button
    type="button"
    className="w-full rounded-md border border-[#d7e3e6] px-3 py-2 text-left hover:border-[#00778B] disabled:opacity-60"
    disabled={pending}
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
  const pathname = usePathname();
  const { page } = useSitecore();
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [guestEmail, setGuestEmail] = useState<string | null>(null);
  const [trail, setTrail] = useState<string[]>([]);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

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

    const email = window.localStorage.getItem(DEMO_GUEST_STORAGE_KEY);
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
  const pending = pendingEmail !== null;

  const selectGuest = async (nextGuest: DemoGuest | null) => {
    setPendingEmail(nextGuest?.email ?? 'anonymous');

    if (nextGuest) {
      window.localStorage.setItem(DEMO_GUEST_STORAGE_KEY, nextGuest.email);
      try {
        await identifyDemoGuest(nextGuest);
      } catch {
        // The Events SDK is not initialized in development or in Pages.
      }
    } else {
      window.localStorage.removeItem(DEMO_GUEST_STORAGE_KEY);
    }

    reloadPage();
  };

  return (
    <>
      {guest && !open ? (
        <div
          className="fixed right-4 bottom-20 z-[60] w-[20rem] max-w-[calc(100vw-2rem)] rounded-md border border-[#00778B] bg-white px-4 py-3 text-sm text-[#16323a] shadow-lg"
          data-testid="demo-guest-banner"
        >
          {guestPageLine(guest)}
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
              <h2 className="mt-1 text-xl font-semibold">What Sitecore knows</h2>
            </div>
            <button type="button" className="text-sm text-[#00778B]" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>

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
                <Fact label="Affinity" value={guest.contentAffinity} />
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
                  pending={pending}
                  onSelect={selectGuest}
                />
              ))}
            </div>
            <button
              type="button"
              className="mt-3 text-sm font-semibold text-[#00778B]"
              onClick={() => setShowMore((current) => !current)}
            >
              {showMore ? 'Hide guests' : `More guests (${moreDemoGuests().length})`}
            </button>
            {showMore ? (
              <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                {moreDemoGuests().map((choice) => (
                  <GuestChoice
                    key={choice.email}
                    guest={choice}
                    pending={pending}
                    onSelect={selectGuest}
                  />
                ))}
              </div>
            ) : null}
            <button
              type="button"
              className="mt-4 text-sm text-[#5c6b70] underline"
              disabled={pending}
              onClick={() => selectGuest(null)}
            >
              Browse as anonymous
            </button>
          </section>

          {process.env.NODE_ENV === 'development' ? (
            <p className="mt-6 text-xs text-[#5c6b70]">
              On localhost the Cloud SDK stays off, so this browser remembers the guest locally. On
              the deployed site the same click sends an identity event for that email, then reloads.
            </p>
          ) : (
            <p className="mt-6 text-xs text-[#5c6b70]">
              Choosing a guest sends an identity event for that email and reloads this page.
            </p>
          )}
        </aside>
      ) : null}
    </>
  );
};

export default GuestPanel;
