'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Link as ContentSdkLink,
  NextImage as ContentSdkImage,
  AppPlaceholder,
} from '@sitecore-content-sdk/nextjs';
import { Search, Truck, User } from 'lucide-react';
import Link from 'next/link';
import { MiniCart } from './non-sitecore/MiniCart';
import { SearchBox } from './non-sitecore/SearchBox';
import { MobileMenuWrapper } from './MobileMenuWrapper';
import { LocationRegionalNav } from './LocationRegionalNav';
import { MyRecologyMenu, regionalUtilityHref } from './MyRecologyMenu';
import { useLocationNav } from './location-nav-client';
import type { HeaderSTProps } from './header-st.props';
import { getDatasource, getFieldValue } from '@/lib/component-props';
import { cn } from '@/lib/utils';

const navLinkClass = 'block p-4 font-[family-name:var(--font-accent)] font-medium';

// Deferred until render so this client module can finish exporting Default
// before component-map reads it (avoids TDZ circular init).
const getComponentMap = () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('.sitecore/component-map').default;

export const Default = (props: HeaderSTProps) => {
  const fields = getDatasource(props.fields);

  return (
    <section className={`${props.params?.styles}`} data-class-change>
      <div className="flex justify-between items-start">
        <Link
          href="/"
          className="relative flex justify-center items-center grow-0 shrink-0 w-24 lg:w-32 h-24 lg:h-32 p-4 lg:p-6 bg-primary z-100"
          prefetch={false}
        >
          <ContentSdkImage field={getFieldValue(fields?.Logo)} className="w-full h-full object-contain" />
        </Link>

        <div
          className="relative flex [.partial-editing-mode_&]:flex-col-reverse justify-between items-start gap-10 grow max-w-7xl lg:px-4 bg-background"
          role="navigation"
        >
          <ul className="hidden lg:flex flex-row lg:[.partial-editing-mode_&]:!flex-col text-left bg-background">
            <AppPlaceholder
              name={`header-navigation-${props.params?.DynamicPlaceholderId}`}
              rendering={props.rendering}
              page={props.page}
              componentMap={getComponentMap()}
            />
          </ul>
          <div className="basis-full lg:basis-auto lg:ml-auto">
            <ul className="flex">
              <li className="hidden lg:block">
                <ContentSdkLink
                    field={getFieldValue(fields?.SupportLink)!}
                  prefetch={false}
                  className={navLinkClass}
                />
              </li>
              <li className="mr-auto lg:mr-0">
                {props.params.showSearchBox ? (
                  <SearchBox searchLink={getFieldValue(fields?.SearchLink)!} />
                ) : (
                  <ContentSdkLink
                    field={getFieldValue(fields?.SearchLink)!}
                    prefetch={false}
                    className={navLinkClass}
                  />
                )}
              </li>
              <MobileMenuWrapper>
                <div className="lg:hidden flex flex-col w-full h-full">
                  <div className="flex-1 flex items-center justify-center">
                    <ul className="flex flex-col text-center bg-background">
                      <AppPlaceholder
                        name={`header-navigation-${props.params?.DynamicPlaceholderId}`}
                        rendering={props.rendering}
                        page={props.page}
                        componentMap={getComponentMap()}
                      />
                    </ul>
                  </div>
                  <div className="w-full">
                    <hr className="w-full border-border" />
                    <ul className="text-center">
                      <li>
                        <ContentSdkLink
                          field={getFieldValue(fields?.SupportLink)!}
                          prefetch={false}
                          className={navLinkClass}
                        />
                      </li>
                    </ul>
                  </div>
                </div>
              </MobileMenuWrapper>
              <li>
                {props.params.showMiniCart ? (
                  <MiniCart cartLink={getFieldValue(fields?.CartLink)!} />
                ) : (
                  <ContentSdkLink
                    field={getFieldValue(fields?.CartLink)!}
                    prefetch={false}
                    className="block p-4"
                  >
                    <FontAwesomeIcon icon={faShoppingCart} width={24} height={24} />
                  </ContentSdkLink>
                )}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

const SOLID_AFTER_PX = 12;
const HIDE_AFTER_PX = 180;

type HeaderChrome = 'top' | 'solid' | 'hidden';

const isChecked = (value?: string) => value === '1' || value?.toLowerCase() === 'true';

const HeaderSTScrollFrame = ({
  children,
  className,
  isEditing = false,
}: {
  children: ReactNode;
  className?: string;
  isEditing?: boolean;
}) => {
  const [chrome, setChrome] = useState<HeaderChrome>('top');
  const lastY = useRef(0);
  const hasMeasured = useRef(false);

  useEffect(() => {
    if (isEditing) return;

    const update = () => {
      const y = window.scrollY || 0;
      const delta = y - lastY.current;
      const goingDown = delta > 2;
      const goingUp = delta < -2;
      lastY.current = y;

      setChrome((current) => {
        if (!hasMeasured.current) {
          hasMeasured.current = true;
          if (y <= SOLID_AFTER_PX) return 'top';
          if (y > HIDE_AFTER_PX) return 'hidden';
          return 'solid';
        }

        if (y <= SOLID_AFTER_PX) return 'top';
        if (goingUp) return 'solid';
        if (goingDown && y > HIDE_AFTER_PX) return 'hidden';
        if (current === 'hidden') return 'hidden';
        return 'solid';
      });
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [isEditing]);

  const visibleChrome = isEditing ? 'editing' : chrome;

  return (
    <header
      className={cn(
        className,
        'z-50 w-full text-primary-foreground transition-transform duration-300 ease-out motion-reduce:transition-none',
        isEditing ? 'relative bg-primary' : 'fixed inset-x-0 top-0',
        !isEditing && chrome === 'top' && 'bg-transparent',
        !isEditing && chrome !== 'top' && 'bg-primary',
        !isEditing && chrome === 'hidden' && '-translate-y-full'
      )}
      data-class-change
      data-header-chrome={visibleChrome}
      data-testid="header-st-version4"
    >
      {children}
    </header>
  );
};

const iconControlClass =
  'inline-flex size-11 items-center justify-center text-primary-foreground hover:opacity-80';

const version4NavClass = [
  'hidden min-w-0 flex-1 items-center justify-center lg:flex',
  '[&_span.inline-block]:!px-2.5 [&_span.inline-block]:!py-2 [&_span.inline-block]:xl:!px-3.5',
  '[&_a]:font-(family-name:--font-heading) [&_a]:text-sm [&_a]:font-bold [&_a]:uppercase [&_a]:tracking-wide [&_a]:text-primary-foreground',
  '[&_span]:font-(family-name:--font-heading) [&_span]:text-sm [&_span]:font-bold [&_span]:uppercase [&_span]:tracking-wide [&_span]:text-primary-foreground',
  '[&_.bg-background]:!text-foreground',
  '[&_.bg-background_a]:!font-medium [&_.bg-background_a]:!text-base [&_.bg-background_a]:!normal-case [&_.bg-background_a]:!tracking-normal [&_.bg-background_a]:!text-foreground',
  '[&_.bg-background_span]:!font-medium [&_.bg-background_span]:!normal-case [&_.bg-background_span]:!tracking-normal [&_.bg-background_span]:!text-foreground',
].join(' ');

const HeaderSTVersion4View = (props: HeaderSTProps) => {
  const fields = getDatasource(props.fields);
  const showSearchBox = Boolean(props.params?.showSearchBox);
  const showMiniCart = Boolean(props.params?.showMiniCart) && !isChecked(props.params?.HideCart);
  const searchLink = getFieldValue(fields?.SearchLink);
  const loginLink = getFieldValue(fields?.LoginLink);
  const cartLink = getFieldValue(fields?.CartLink);
  const placeholderName = `header-navigation-${props.params?.DynamicPlaceholderId}`;

  return (
    <div className="mx-auto flex h-[4.5rem] w-full max-w-[90rem] items-center gap-3 px-4 lg:px-6">
      <Link
        href="/"
        className="relative z-10 flex h-12 shrink-0 items-center rounded-md bg-background px-2.5 py-1.5"
        prefetch={false}
        aria-label="Home"
      >
        <ContentSdkImage
          field={getFieldValue(fields?.Logo)}
          className="h-8 w-auto max-w-[7.5rem] object-contain"
        />
      </Link>

      <nav className={version4NavClass} aria-label="Primary">
        <ul className="flex flex-row items-center">
          <AppPlaceholder
            name={placeholderName}
            rendering={props.rendering}
            page={props.page}
            componentMap={getComponentMap()}
          />
        </ul>
      </nav>

      <div className="ml-auto flex items-center text-primary-foreground">
        {loginLink ? (
          <ContentSdkLink
            field={loginLink}
            prefetch={false}
            className={iconControlClass}
            aria-label={loginLink.value?.text || 'Log in'}
          >
            <User className="size-6" strokeWidth={1.75} aria-hidden />
          </ContentSdkLink>
        ) : (
          <span className={iconControlClass} aria-hidden>
            <User className="size-6" strokeWidth={1.75} />
          </span>
        )}

        {showSearchBox && searchLink ? (
          <SearchBox searchLink={searchLink} />
        ) : searchLink ? (
          <ContentSdkLink
            field={searchLink}
            prefetch={false}
            className={iconControlClass}
            aria-label={searchLink.value?.text || 'Search'}
          >
            <Search className="size-6" strokeWidth={1.75} aria-hidden />
          </ContentSdkLink>
        ) : (
          <span className={iconControlClass} aria-hidden>
            <Search className="size-6" strokeWidth={1.75} />
          </span>
        )}

        <MobileMenuWrapper alwaysVisible className="p-2 text-primary-foreground">
          <div className="flex h-full w-full flex-col">
            <div className="flex flex-1 items-center justify-center">
              <ul className="flex flex-col bg-background text-center text-foreground">
                <AppPlaceholder
                  name={placeholderName}
                  rendering={props.rendering}
                  page={props.page}
                  componentMap={getComponentMap()}
                />
              </ul>
            </div>
          </div>
        </MobileMenuWrapper>

        {showMiniCart && cartLink ? <MiniCart cartLink={cartLink} /> : null}
      </div>
    </div>
  );
};

export const Version4 = (props: HeaderSTProps) => (
  <HeaderSTScrollFrame
    className={props.params?.styles}
    isEditing={Boolean(props.page?.mode?.isEditing)}
  >
    <HeaderSTVersion4View {...props} />
  </HeaderSTScrollFrame>
);

const recologyMainNavClass = [
  'hidden min-w-0 flex-1 items-center lg:flex',
  '[&_ul]:flex [&_ul]:flex-row [&_ul]:items-center',
  '[&_li]:w-auto [&_li]:basis-auto',
  '[&_a]:px-2.5 [&_a]:py-2 [&_a]:text-sm [&_a]:font-normal [&_a]:text-foreground',
  '[&_button]:px-2.5 [&_button]:py-2 [&_button]:text-sm [&_button]:font-normal [&_button]:text-foreground',
  '[&_span]:text-sm [&_span]:font-normal [&_span]:text-foreground',
].join(' ');

const recologyLocationNavClass = 'min-w-0 flex-1';

const locationRootFromSupportLink = (
  supportLink?: { value?: { id?: string; href?: string; text?: string } }
): string | undefined => {
  const id = supportLink?.value?.id?.replace(/[{}]/g, '').trim();
  if (id) return id;
  // Fall back to site-relative path when id is missing (still resolves via Edge path).
  const href = supportLink?.value?.href?.trim();
  if (href?.startsWith('/') && href.length > 1) return href;
  return undefined;
};

const HeaderSearchForm = ({
  searchLink,
}: {
  searchLink?: { value?: { href?: string; text?: string } };
}) => {
  const action = searchLink?.value?.href || '/Search';
  const label = searchLink?.value?.text || 'Search';

  return (
    <form action={action} method="get" role="search" className="hidden items-stretch lg:flex">
      <input
        type="search"
        name="q"
        aria-label={label}
        className="h-10 w-40 border border-r-0 border-input bg-background px-3 text-sm text-foreground xl:w-56"
      />
      <button type="submit" className="btn btn-outline h-10 rounded-none">
        {label}
      </button>
    </form>
  );
};

const HeaderSTRecologyView = ({
  showLocationNav = false,
  ...props
}: HeaderSTProps & { showLocationNav?: boolean }) => {
  const fields = getDatasource(props.fields);
  const showSearchBox = Boolean(props.params?.showSearchBox);
  const showMiniCart = Boolean(props.params?.showMiniCart) && !isChecked(props.params?.HideCart);
  const searchLink = getFieldValue(fields?.SearchLink);
  const supportLink = getFieldValue(fields?.SupportLink);
  const cartLink = getFieldValue(fields?.CartLink);
  const placeholderId = props.params?.DynamicPlaceholderId || '1';
  const mainPlaceholder = `header-navigation-${placeholderId}`;
  const routeItemId = props.page?.layout?.sitecore?.route?.itemId;
  // Prefer SupportLink target (LocationItem) so dropdowns resolve even from nested pages.
  const locationNavItemId = locationRootFromSupportLink(supportLink) || routeItemId;
  const language = props.page?.locale || 'en';
  const isEditing = Boolean(props.page?.mode?.isEditing);
  const locationNav = useLocationNav(showLocationNav ? locationNavItemId : undefined, language);
  const whatBinHref = regionalUtilityHref(locationNav, 'What Bin', '');
  const utilityLinks = [
    { href: regionalUtilityHref(locationNav, 'Pay My Bill', '/Pay-My-Bill'), label: 'Pay My Bill' },
    { href: regionalUtilityHref(locationNav, 'FAQ', '/FAQ'), label: 'FAQ' },
    ...(whatBinHref ? [{ href: whatBinHref, label: 'What Bin' }] : []),
    { href: regionalUtilityHref(locationNav, 'Contact Us', '/Contact-Us'), label: 'Contact Us' },
  ];

  return (
    <header
      className={cn(props.params?.styles, 'w-full bg-background text-foreground')}
      data-class-change
      data-testid={showLocationNav ? 'header-st-regional' : 'header-st-recology-global'}
    >
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl justify-end px-4 lg:px-6">
          <ul className="flex items-center">
            {utilityLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="block px-3 py-2 text-sm text-primary-foreground" prefetch={false}>
                  {link.label}
                </Link>
              </li>
            ))}
            {showLocationNav && locationNav ? (
              <MyRecologyMenu nav={locationNav} language={language} />
            ) : (
              <li>
                <Link href="/Location" className="block px-3 py-2 text-sm text-primary-foreground" prefetch={false}>
                  My Recology
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 lg:px-6">
          <Link href="/" className="flex h-14 shrink-0 items-center" prefetch={false} aria-label="Recology">
            <ContentSdkImage field={getFieldValue(fields?.Logo)} className="h-12 w-auto max-w-[9rem] object-contain" />
          </Link>

          <nav className={recologyMainNavClass} aria-label="Primary">
            <ul className="flex flex-row items-center">
              <AppPlaceholder
                name={mainPlaceholder}
                rendering={props.rendering}
                page={props.page}
                componentMap={getComponentMap()}
              />
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {showSearchBox && searchLink ? (
              <HeaderSearchForm searchLink={searchLink} />
            ) : searchLink ? (
              <ContentSdkLink field={searchLink} prefetch={false} className="btn btn-outline hidden lg:inline-flex" />
            ) : null}
            <MobileMenuWrapper className="p-2 text-foreground">
              <ul className="flex flex-col bg-background text-foreground">
                <AppPlaceholder
                  name={mainPlaceholder}
                  rendering={props.rendering}
                  page={props.page}
                  componentMap={getComponentMap()}
                />
                {showLocationNav ? (
                  <li className="border-t border-border pt-2">
                    <LocationRegionalNav
                      itemId={locationNavItemId}
                      language={language}
                      stacked
                    />
                  </li>
                ) : null}
              </ul>
            </MobileMenuWrapper>
            {showMiniCart && cartLink ? <MiniCart cartLink={cartLink} /> : null}
          </div>
        </div>
      </div>

      {showLocationNav ? (
        <div className="relative z-50 border-b border-border bg-background">
          <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-1 lg:gap-3 lg:px-6">
            <Truck className="size-9 shrink-0 text-primary" aria-hidden data-testid="truck-icon" />
            <nav className={recologyLocationNavClass} aria-label="Location">
              <LocationRegionalNav itemId={locationNavItemId} language={language} />
              {isEditing && !locationNavItemId ? (
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  Set SupportLink to the LocationItem (e.g. Recology American Canyon) so regional
                  dropdowns can load its child pages.
                </p>
              ) : null}
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
};

/** Recology corporate header. Version5 remains an alias for pages still assigned to that name. */
export const RecologyGlobal = (props: HeaderSTProps) => <HeaderSTRecologyView {...props} />;

export const Version5 = RecologyGlobal;

/** Regional location header: utility + main nav + truck row with tree-driven dropdowns. */
export const Regional = (props: HeaderSTProps) => <HeaderSTRecologyView {...props} showLocationNav />;

/** @deprecated Prefer Regional — kept so existing Page variants keep rendering. */
export const Version6 = Regional;
