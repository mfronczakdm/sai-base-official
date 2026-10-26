'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useToggleWithClickOutside } from '@/hooks/useToggleWithClickOutside';
import type { LocationNavResult, LocationNavSection } from '@/lib/location-nav-from-edge';
import { cn } from '@/lib/utils';

type LocationRegionalNavProps = {
  itemId?: string;
  language?: string;
  className?: string;
};

const SectionDropdown = ({ section }: { section: LocationNavSection }) => {
  const { isVisible, setIsVisible, ref } = useToggleWithClickOutside<HTMLLIElement>(false);
  const hasChildren = section.children.length > 0;

  if (!hasChildren) {
    return (
      <li>
        <Link
          href={section.href}
          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold uppercase tracking-wide text-foreground"
          prefetch={false}
        >
          {section.title}
        </Link>
      </li>
    );
  }

  return (
    <li ref={ref} className="relative">
      <button
        type="button"
        className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold uppercase tracking-wide text-foreground"
        aria-expanded={isVisible}
        aria-haspopup="true"
        onClick={() => setIsVisible(!isVisible)}
      >
        {section.title}
        <ChevronDown className={cn('size-3.5 transition-transform', isVisible && 'rotate-180')} aria-hidden />
      </button>
      <ul
        className={cn(
          'absolute left-0 top-full z-50 min-w-[14rem] border border-border bg-background py-2 shadow-md',
          isVisible ? 'visible opacity-100' : 'invisible opacity-0 pointer-events-none'
        )}
        role="menu"
      >
        {section.children.map((child) => (
          <li key={child.href} role="none">
            <Link
              href={child.href}
              role="menuitem"
              className="block px-4 py-2 text-sm font-normal normal-case tracking-normal text-foreground hover:bg-muted"
              prefetch={false}
              onClick={() => setIsVisible(false)}
            >
              {child.title}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
};

export const LocationRegionalNav = ({ itemId, language = 'en', className }: LocationRegionalNavProps) => {
  const [nav, setNav] = useState<LocationNavResult | null>(null);

  useEffect(() => {
    if (!itemId) {
      setNav(null);
      return;
    }

    let cancelled = false;
    const params = new URLSearchParams({ itemId, language });

    fetch(`/api/location-nav?${params.toString()}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: LocationNavResult | null) => {
        if (!cancelled) setNav(data);
      })
      .catch(() => {
        if (!cancelled) setNav(null);
      });

    return () => {
      cancelled = true;
    };
  }, [itemId, language]);

  if (!nav?.sections?.length) {
    return null;
  }

  return (
    <ul className={cn('flex flex-row flex-wrap items-center', className)} data-testid="location-regional-nav">
      {nav.sections.map((section) => (
        <SectionDropdown key={section.href} section={section} />
      ))}
    </ul>
  );
};
