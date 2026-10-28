import {
  faFacebook,
  faInstagram,
  faLinkedinIn,
  faXTwitter,
  faYoutube,
} from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  RichText as ContentSdkRichText,
  Text as ContentSdkText,
  Link as ContentSdkLink,
  LinkField,
  AppPlaceholder,
} from '@sitecore-content-sdk/nextjs';
import componentMap from '.sitecore/component-map';
import type { FooterSTProps, SocialLinksProps } from './footer-st.props';
import { getDatasource, getFieldValue } from '@/lib/component-props';

/** Returns true if the link field has a valid href (not a placeholder like # or http://#). */
function hasValidLink(field: LinkField | undefined): boolean {
  const href = field?.value?.href;
  return !!(href && href !== '#' && !href.startsWith('http://#'));
}

const SocialLinks = ({ fields }: SocialLinksProps) => (
  <div className="flex justify-center gap-4">
    {hasValidLink(getFieldValue(fields?.FacebookLink)) ? (
      <ContentSdkLink
        field={getFieldValue(fields?.FacebookLink)!}
        prefetch={false}
        aria-label="Facebook"
      >
        <FontAwesomeIcon icon={faFacebook} width={20} height={20} />
      </ContentSdkLink>
    ) : (
      <span role="img" aria-label="Facebook">
        <FontAwesomeIcon icon={faFacebook} width={20} height={20} />
      </span>
    )}
    {hasValidLink(getFieldValue(fields?.InstagramLink)) ? (
      <ContentSdkLink
        field={getFieldValue(fields?.InstagramLink)!}
        prefetch={false}
        aria-label="Instagram"
      >
        <FontAwesomeIcon icon={faInstagram} width={22} height={22} />
      </ContentSdkLink>
    ) : (
      <span role="img" aria-label="Instagram">
        <FontAwesomeIcon icon={faInstagram} width={22} height={22} />
      </span>
    )}
    {hasValidLink(getFieldValue(fields?.LinkedinLink)) ? (
      <ContentSdkLink
        field={getFieldValue(fields?.LinkedinLink)!}
        prefetch={false}
        aria-label="LinkedIn"
      >
        <FontAwesomeIcon icon={faLinkedinIn} width={24} height={24} />
      </ContentSdkLink>
    ) : (
      <span role="img" aria-label="LinkedIn">
        <FontAwesomeIcon icon={faLinkedinIn} width={24} height={24} />
      </span>
    )}
  </div>
);

/** Legacy SYNC-style textured footer (formerly Default). */
export const Sync = (props: FooterSTProps) => {
  const fields = getDatasource(props.fields);

  return (
    <section
      className={`relative bg-primary pt-16 lg:pt-30 pb-8 bg-cover bg-center ${props.params.styles}`}
      style={{ backgroundImage: 'url("/footer-texture.webp")' }}
      data-class-change
      data-testid="footerst-sync"
    >
      <div className="container mx-auto px-4">
        <h2 className="text-4xl lg:text-7xl mb-10 lg:mb-20 uppercase">
          <ContentSdkText field={getFieldValue(fields?.Title)} />
        </h2>
        <div className="max-w-5xl mx-auto mb-6 lg:mb-12 font-(family-name:--font-heading) text-2xl uppercase">
          <AppPlaceholder
            name={`footer-primary-links-${props.params.DynamicPlaceholderId}`}
            rendering={props.rendering}
            page={props.page}
            componentMap={componentMap}
          />
        </div>
        <div className="max-w-5xl mx-auto font-(family-name:--font-accent) font-medium">
          <AppPlaceholder
            name={`footer-secondary-links-${props.params.DynamicPlaceholderId}`}
            rendering={props.rendering}
            page={props.page}
            componentMap={componentMap}
          />
        </div>
      </div>
      <div className="h-20 lg:h-40 bg-sound-waves bg-contain bg-repeat bg-center my-12 lg:my-16"></div>
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-4 items-center lg:flex-row lg:justify-between">
          <SocialLinks fields={fields} />
          <div>
            <ContentSdkRichText field={getFieldValue(fields?.CopyrightText)} />
          </div>
        </div>
      </div>
    </section>
  );
};

export const LogoLeft = (props: FooterSTProps) => {
  const fields = getDatasource(props.fields);

  return (
    <section
      className={`relative bg-primary pt-16 lg:pt-30 bg-cover bg-center ${props.params.styles}`}
      style={{ backgroundImage: 'url("/footer-texture.webp")' }}
      data-class-change
    >
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2">
          <h2 className="text-4xl lg:text-7xl mb-10 lg:mb-0 uppercase">
            <ContentSdkText field={getFieldValue(fields?.Title)} />
          </h2>
          <div className="lg:flex justify-end items-start gap-12">
            <div className="mb-6 lg:mb-0 font-(family-name:--font-heading) uppercase text-2xl">
              <AppPlaceholder
                name={`footer-primary-links-${props.params.DynamicPlaceholderId}`}
                rendering={props.rendering}
                page={props.page}
                componentMap={componentMap}
              />
            </div>
            <div className="font-(family-name:--font-accent) font-medium">
              <AppPlaceholder
                name={`footer-secondary-links-${props.params.DynamicPlaceholderId}`}
                rendering={props.rendering}
                page={props.page}
                componentMap={componentMap}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 items-center lg:flex-row lg:justify-between mt-8">
          <SocialLinks fields={fields} />
          <div>
            <ContentSdkRichText field={getFieldValue(fields?.CopyrightText)} />
          </div>
        </div>
      </div>
      <div className="h-10 lg:h-20 bg-sound-waves bg-[length:auto_200%] bg-repeat bg-top bg-center-x mt-12 lg:mt-16"></div>
    </section>
  );
};

export const LogoRight = (props: FooterSTProps) => {
  const fields = getDatasource(props.fields);

  return (
    <section
      className={`relative bg-primary pb-8 bg-cover bg-center ${props.params.styles}`}
      style={{ backgroundImage: 'url("/footer-texture.webp")' }}
      data-class-change
    >
      <div className="h-10 lg:h-20 bg-sound-waves bg-[length:auto_200%] bg-repeat bg-bottom bg-center-x mb-12 lg:mb-16"></div>
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2">
          <h2 className="lg:order-2 text-4xl lg:text-7xl mb-10 lg:mb-0 lg:text-right uppercase">
            <ContentSdkText field={getFieldValue(fields?.Title)} />
          </h2>
          <div className="lg:flex items-start gap-12">
            <div className="mb-6 lg:mb-0 font-(family-name:--font-heading) uppercase text-2xl">
              <AppPlaceholder
                name={`footer-primary-links-${props.params.DynamicPlaceholderId}`}
                rendering={props.rendering}
                page={props.page}
                componentMap={componentMap}
              />
            </div>
            <div className="font-(family-name:--font-accent) font-medium">
              <AppPlaceholder
                name={`footer-secondary-links-${props.params.DynamicPlaceholderId}`}
                rendering={props.rendering}
                page={props.page}
                componentMap={componentMap}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 items-center lg:flex-row lg:justify-between mt-8">
          <SocialLinks fields={fields} />
          <div>
            <ContentSdkRichText field={getFieldValue(fields?.CopyrightText)} />
          </div>
        </div>
      </div>
    </section>
  );
};

export const Centered = (props: FooterSTProps) => {
  const fields = getDatasource(props.fields);

  return (
    <section
      className={`relative bg-primary py-8 lg:py-20 bg-cover bg-center ${props.params.styles}`}
      style={{ backgroundImage: 'url("/footer-texture.webp")' }}
      data-class-change
    >
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-20 lg:h-40 bg-sound-waves bg-contain bg-repeat bg-center filter invert opacity-75 z-10"></div>
      <div className="relative container mx-auto px-4 z-20">
        <div className="grid lg:grid-cols-3 lg:gap-4">
          <h2 className="text-4xl lg:text-5xl mb-10 lg:mb-0 uppercase">
            <ContentSdkText field={getFieldValue(fields?.Title)} />
          </h2>
          <div>
            <div className="mb-6 lg:mb-12 font-(family-name:--font-heading) uppercase text-2xl">
              <AppPlaceholder
                name={`footer-primary-links-${props.params.DynamicPlaceholderId}`}
                rendering={props.rendering}
                page={props.page}
                componentMap={componentMap}
              />
            </div>
            <div className="font-(family-name:--font-accent) font-medium">
              <AppPlaceholder
                name={`footer-secondary-links-${props.params.DynamicPlaceholderId}`}
                rendering={props.rendering}
                page={props.page}
                componentMap={componentMap}
              />
            </div>
          </div>
          <div className="flex flex-col gap-4 items-center lg:items-end lg:self-end mt-8">
            <SocialLinks fields={fields} />
            <div>
              <ContentSdkRichText field={getFieldValue(fields?.CopyrightText)} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const BCAA_SOCIAL = [
  { href: 'https://www.facebook.com/BCAA', label: 'Facebook', icon: faFacebook },
  { href: 'https://x.com/BCAA', label: 'X', icon: faXTwitter },
  { href: 'https://www.youtube.com/user/BCAA', label: 'YouTube', icon: faYoutube },
  { href: 'https://www.instagram.com/bcaa/', label: 'Instagram', icon: faInstagram },
] as const;

const RECOLOGY_SOCIAL = [
  { href: 'https://www.facebook.com/Recology', label: 'Facebook', icon: faFacebook },
  { href: 'https://twitter.com/RecologyWZ', label: 'X', icon: faXTwitter },
  { href: 'https://www.linkedin.com/company/recology', label: 'LinkedIn', icon: faLinkedinIn },
  { href: 'https://www.youtube.com/user/Recologize', label: 'YouTube', icon: faYoutube },
  { href: 'https://www.instagram.com/recology', label: 'Instagram', icon: faInstagram },
] as const;

const RECOLOGY_LEGAL = [
  { href: 'https://www.recology.com/privacy/', label: 'Privacy Policy' },
  { href: 'https://www.recology.com/terms/', label: 'Terms of Use' },
  {
    href: 'https://www.recology.com/electronic-bill-payment-service-agreement/',
    label: 'Electronic Bill Payment Service Agreement',
  },
  { href: 'https://www.recology.com/disclosures/', label: 'Disclosures and Notices' },
  { href: 'https://www.recology.com/compliance/', label: 'Compliance' },
] as const;

/**
 * Recology.com-style footer: light bar, centered social icons, then centered legal links.
 * Matches https://www.recology.com/ page-footer (social list + footer-nav).
 */
export const Recology = (props: FooterSTProps) => {
  const fields = getDatasource(props.fields);
  const facebookField = getFieldValue(fields?.FacebookLink);
  const linkedinField = getFieldValue(fields?.LinkedinLink);
  const instagramField = getFieldValue(fields?.InstagramLink);

  const socialItems = [
    {
      href: hasValidLink(facebookField) ? facebookField!.value.href! : RECOLOGY_SOCIAL[0].href,
      label: 'Facebook',
      icon: faFacebook,
    },
    RECOLOGY_SOCIAL[1],
    {
      href: hasValidLink(linkedinField) ? linkedinField!.value.href! : RECOLOGY_SOCIAL[2].href,
      label: 'LinkedIn',
      icon: faLinkedinIn,
    },
    RECOLOGY_SOCIAL[3],
    {
      href: hasValidLink(instagramField) ? instagramField!.value.href! : RECOLOGY_SOCIAL[4].href,
      label: 'Instagram',
      icon: faInstagram,
    },
  ];

  return (
    <footer
      className={`border-t border-border bg-[#f5f5f5] text-foreground ${props.params?.styles || ''}`}
      data-class-change
      data-testid="footerst-recology"
    >
      <div className="container mx-auto px-4 py-10 lg:py-12">
        <ul
          className="mb-6 flex list-none flex-wrap items-center justify-center gap-5 p-0"
          data-testid="footerst-recology-social"
        >
          {socialItems.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                aria-label={`${item.label} (Opens in new window)`}
                className="inline-flex text-foreground/80 transition-opacity hover:opacity-70"
                rel="noreferrer"
                target="_blank"
              >
                <FontAwesomeIcon icon={item.icon} width={22} height={22} />
              </a>
            </li>
          ))}
        </ul>

        <nav aria-label="Footer legal" data-testid="footerst-recology-legal">
          <ul className="m-0 flex list-none flex-wrap items-center justify-center gap-x-6 gap-y-2 p-0">
            {RECOLOGY_LEGAL.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="text-sm text-foreground/80 no-underline hover:underline"
                  rel="noreferrer"
                  target="_blank"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-6 text-center text-xs leading-relaxed text-foreground/60 [&_p]:m-0">
          <ContentSdkRichText field={getFieldValue(fields?.CopyrightText)} />
        </div>
      </div>
    </footer>
  );
};

/** Recology.com page-footer layout — Default for Recology partials. */
export const Default = (props: FooterSTProps) => <Recology {...props} />;

export const Version2 = (props: FooterSTProps) => {
  const fields = getDatasource(props.fields);
  const placeholderId = props.params?.DynamicPlaceholderId;
  const facebookField = getFieldValue(fields?.FacebookLink);
  const instagramField = getFieldValue(fields?.InstagramLink);

  const socialItems = [
    {
      href: hasValidLink(facebookField) ? facebookField!.value.href : BCAA_SOCIAL[0].href,
      label: 'Facebook',
      icon: faFacebook,
    },
    BCAA_SOCIAL[1],
    BCAA_SOCIAL[2],
    {
      href: hasValidLink(instagramField) ? instagramField!.value.href : BCAA_SOCIAL[3].href,
      label: 'Instagram',
      icon: faInstagram,
    },
  ];

  return (
    <section
      className={`bg-primary text-primary-foreground ${props.params?.styles || ''}`}
      data-class-change
      data-testid="footerst-version2"
    >
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div
            className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-9 lg:grid-cols-5 [&_a]:text-primary-foreground [&_h2]:text-primary-foreground [&_h3]:text-primary-foreground"
            data-testid="footerst-version2-columns"
          >
            <AppPlaceholder
              name={`footer-primary-links-${placeholderId}`}
              rendering={props.rendering}
              page={props.page}
              componentMap={componentMap}
            />
          </div>
          <div className="flex flex-col gap-8 lg:col-span-3">
            <div>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide">
                <ContentSdkText field={getFieldValue(fields?.Title)} />
              </h2>
              <AppPlaceholder
                name={`footer-secondary-links-${placeholderId}`}
                rendering={props.rendering}
                page={props.page}
                componentMap={componentMap}
              />
            </div>
            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-wide">Follow BCAA</p>
              <div className="flex items-center gap-4" data-testid="footerst-version2-social">
                {socialItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    aria-label={item.label}
                    className="text-primary-foreground hover:opacity-80"
                    rel="noreferrer"
                    target="_blank"
                  >
                    <FontAwesomeIcon icon={item.icon} width={18} height={18} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
        <hr className="my-10 border-primary-foreground/25" />
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div
            className="inline-flex shrink-0 items-center border border-primary-foreground px-3 py-1 text-sm font-bold tracking-[0.35em]"
            aria-label="BCAA"
          >
            BCAA
          </div>
          <div className="max-w-3xl text-xs leading-relaxed text-primary-foreground/80 [&_a]:underline [&_p]:mb-3">
            <ContentSdkRichText field={getFieldValue(fields?.CopyrightText)} />
          </div>
        </div>
      </div>
    </section>
  );
};
