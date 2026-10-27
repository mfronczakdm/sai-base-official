'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useToggleWithClickOutside } from '@/hooks/useToggleWithClickOutside';
import type { LocationNavResult, LocationNavSection } from '@/lib/location-nav-from-edge';
import { cn } from '@/lib/utils';

type LocationRegionalNavProps = {
  /** Current page item id (walks up to LocationItem) or LocationItem id directly. */
  itemId?: string;
  language?: string;
  className?: string;
  /** Stack triggers vertically (mobile drawer). */
  stacked?: boolean;
};

const triggerClass =
  'inline-flex items-center gap-1 px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-primary whitespace-nowrap';

const SectionDropdown = ({
  section,
  stacked,
}: {
  section: LocationNavSection;
  stacked?: boolean;
}) => {
  const { isVisible, setIsVisible, ref } = useToggleWithClickOutside<HTMLLIElement>(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasChildren = section.children.length > 0;

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const openMenu = () => {
    clearCloseTimer();
    setIsVisible(true);
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setIsVisible(false), 150);
  };

  useEffect(() => () => clearCloseTimer(), []);

  if (!hasChildren) {
    return (
      <li>
        <a href={section.href} className={triggerClass}>
          {section.title}
        </a>
      </li>
    );
  }

  return (
    <li
      ref={ref}
      className={cn('relative', stacked && 'w-full')}
      onMouseEnter={() => {
        if (!stacked) openMenu();
      }}
      onMouseLeave={() => {
        if (!stacked) scheduleClose();
      }}
    >
      <button
        type="button"
        className={cn(triggerClass, stacked && 'w-full justify-between')}
        aria-expanded={isVisible}
        aria-haspopup="true"
        onClick={() => setIsVisible(!isVisible)}
      >
        {section.title}
        <ChevronDown
          className={cn('size-3.5 shrink-0 transition-transform', isVisible && 'rotate-180')}
          aria-hidden
        />
      </button>
      {/* pt-1 bridge keeps hover alive between trigger and panel */}
      <div
        className={cn(
          'z-[60]',
          stacked ? 'relative' : 'absolute left-0 top-full pt-1',
          isVisible ? 'block' : 'hidden'
        )}
      >
        <ul
          className={cn(
            'min-w-[16rem] border border-border bg-background py-1 shadow-sm',
            stacked && 'border-l-2 border-l-primary/30'
          )}
          role="menu"
        >
          {section.children.map((child) => (
            <li key={child.href} role="none">
              <a
                href={child.href}
                role="menuitem"
                className="block px-4 py-2 text-sm font-normal normal-case tracking-normal text-primary hover:bg-muted/60 hover:underline"
                onClick={() => setIsVisible(false)}
              >
                {child.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
};

export const LocationRegionalNav = ({
  itemId,
  language = 'en',
  className,
  stacked = false,
}: LocationRegionalNavProps) => {
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
    <ul
      className={cn(
        stacked ? 'flex flex-col items-stretch' : 'flex flex-row flex-wrap items-center',
        className
      )}
      data-testid="location-regional-nav"
    >
      {nav.sections.map((section) => (
        <SectionDropdown key={section.href} section={section} stacked={stacked} />
      ))}
    </ul>
  );
};
