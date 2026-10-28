'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import Link from 'next/link';
import type { LocationNavResult } from '@/lib/location-nav-from-edge';
import type { LocationDirectoryGroup, LocationDirectoryLink } from '@/lib/location-directory';
import { cn } from '@/lib/utils';

type MyRecologyMenuProps = {
  nav: LocationNavResult;
  language?: string;
};

const findHref = (nav: LocationNavResult, title: string): string | undefined => {
  const wanted = title.toLowerCase();
  for (const section of nav.sections) {
    if (section.title.toLowerCase() === wanted || section.name.toLowerCase() === wanted) {
      return section.href;
    }
    const child = section.children.find(
      (entry) => entry.title.toLowerCase() === wanted || entry.name.toLowerCase() === wanted
    );
    if (child) return child.href;
  }
  return undefined;
};

const shortLocationName = (label: string): string =>
  label.replace(/^recology\s+/i, '').trim() || label;

const DirectoryLinks = ({ links }: { links: LocationDirectoryLink[] }) => (
  <ul className="space-y-1">
    {links.map((link) => (
      <li key={link.href}>
        <Link href={link.href} className="hover:underline" prefetch={false}>
          {link.title}
        </Link>
        {link.children.length > 0 ? (
          <ul className="mt-1 space-y-1 border-l border-primary-foreground/30 pl-3">
            {link.children.map((child) => (
              <li key={child.href}>
                <Link href={child.href} className="text-sm hover:underline" prefetch={false}>
                  {child.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </li>
    ))}
  </ul>
);

const LocationDirectoryPanel = ({
  language,
  onClose,
}: {
  language: string;
  onClose: () => void;
}) => {
  const [groups, setGroups] = useState<LocationDirectoryGroup[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ language });
    fetch(`/api/location-directory?${params.toString()}`)
      .then((response) => (response.ok ? response.json() : { groups: [] }))
      .then((data: { groups?: LocationDirectoryGroup[] }) => {
        if (!cancelled) setGroups(data.groups ?? []);
      })
      .catch(() => {
        if (!cancelled) setGroups([]);
      });
    return () => {
      cancelled = true;
    };
  }, [language]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-primary text-primary-foreground" role="dialog" aria-label="All locations">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex justify-end">
          <button type="button" className="p-2" onClick={onClose} aria-label="Close locations">
            <X className="size-6" />
          </button>
        </div>
        {groups === null ? (
          <p className="text-sm">Loading locations…</p>
        ) : groups.length === 0 ? (
          <p className="text-sm">No locations are available.</p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {groups.map((group) => (
              <section key={group.state}>
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wide">{group.state}</h2>
                <DirectoryLinks links={group.links} />
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const MyRecologyMenu = ({ nav, language = 'en' }: MyRecologyMenuProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);
  const place = shortLocationName(nav.locationLabel);
  const homeHref = nav.locationHref || '/Location';
  const accountHref = findHref(nav, 'Pay My Bill') || '/Pay-My-Bill';
  const nearbyHref = findHref(nav, 'Nearby Locations') || homeHref;

  useEffect(() => {
    if (!isVisible) return;
    const onPointer = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setIsVisible(false);
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [isVisible]);

  return (
    <li ref={ref} className="relative">
      <button
        type="button"
        className="inline-flex items-center gap-1 px-3 py-2 text-sm text-primary-foreground"
        aria-expanded={isVisible}
        aria-haspopup="true"
        onClick={() => setIsVisible(!isVisible)}
      >
        My Recology ({place})
        <ChevronDown className={cn('size-3.5', isVisible && 'rotate-180')} aria-hidden />
      </button>
      {isVisible ? (
        <ul className="absolute right-0 z-[70] min-w-[14rem] border border-border bg-background py-1 text-foreground shadow-sm" role="menu">
          <li>
            <Link href={homeHref} className="block px-4 py-2 text-sm hover:bg-muted/60" role="menuitem" prefetch={false} onClick={() => setIsVisible(false)}>
              My Recology Home
            </Link>
          </li>
          <li>
            <Link href={accountHref} className="block px-4 py-2 text-sm hover:bg-muted/60" role="menuitem" prefetch={false} onClick={() => setIsVisible(false)}>
              Manage My Account
            </Link>
          </li>
          <li>
            <Link href={nearbyHref} className="block px-4 py-2 text-sm hover:bg-muted/60" role="menuitem" prefetch={false} onClick={() => setIsVisible(false)}>
              Nearby Locations
            </Link>
          </li>
          <li>
            <button
              type="button"
              className="block w-full px-4 py-2 text-left text-sm hover:bg-muted/60"
              role="menuitem"
              onClick={() => {
                setIsVisible(false);
                setDirectoryOpen(true);
              }}
            >
              See All Locations
            </button>
          </li>
        </ul>
      ) : null}
      {directoryOpen ? (
        <LocationDirectoryPanel language={language} onClose={() => setDirectoryOpen(false)} />
      ) : null}
    </li>
  );
};

export const regionalUtilityHref = (nav: LocationNavResult | null, title: string, fallback: string): string => {
  if (!nav) return fallback;
  return findHref(nav, title) || fallback;
};
