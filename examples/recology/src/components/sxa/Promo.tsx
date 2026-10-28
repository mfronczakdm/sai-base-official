import React, { type JSX } from 'react';
import {
  NextImage as ContentSdkImage,
  Link as ContentSdkLink,
  RichText as ContentSdkRichText,
} from '@sitecore-content-sdk/nextjs';
import { Headset, Laptop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PromoProps } from './sxa-promo.props';

const PromoDefaultComponent = (props: PromoProps): JSX.Element => (
  <div className={`component promo ${props.params.styles}`}>
    <div className="component-content">
      <span className="is-empty-hint">Promo</span>
    </div>
  </div>
);

const hasImageSrc = (field?: { value?: { src?: string } }) => Boolean(field?.value?.src);

export const Default = (props: PromoProps): JSX.Element => {
  const id = props.params.RenderingIdentifier;
  if (props.fields) {
    return (
      <div
        data-class-change
        className={`component promo flex-1 shadow-lg pointer mb-5 lg:mb-0 ${props.params.styles}`}
        id={id ? id : undefined}
      >
        <div className="flex flex-col items-start justify-end h-full">
          <ContentSdkImage field={props.fields.PromoIcon} className="w-full h-auto object-cover" />
          <div className="flex-1 relative pt-4 px-6">
            <ContentSdkRichText
              tag="div"
              className="inline-block text-base font-bold px-2 py-1 mb-4 bg-[#ffb900]"
              field={props.fields.PromoText3}
            />
            <ContentSdkRichText
              tag="h2"
              className="text-3xl font-bold mb-4"
              field={props.fields.PromoText}
            />
            <ContentSdkRichText
              tag="div"
              className="text-base mb-4"
              field={props.fields.PromoText2}
            />
          </div>
          <Button
            variant="default"
            className="font-bold py-1 px-3 mx-6 mb-4 mt-auto relative b-0"
            asChild
          >
            {props.fields.PromoLink ? <ContentSdkLink field={props.fields.PromoLink} /> : null}
          </Button>
        </div>
      </div>
    );
  }

  return <PromoDefaultComponent {...props} />;
};

export const CenteredCard = (props: PromoProps): JSX.Element => {
  const id = props.params.RenderingIdentifier;
  if (props.fields) {
    return (
      <div
        data-class-change
        className={`component promo flex-1 w-full shadow-lg pointer mb-5 lg:mb-0 align-stretch ${props.params.styles}`}
        id={id ? id : undefined}
      >
        <div className="flex flex-col items-start justify-end">
          <ContentSdkImage field={props.fields.PromoIcon} className="w-full h-auto object-cover" />
          <div className="flex-1 relative pt-4 px-4 w-full justify-center text-center">
            <ContentSdkRichText
              tag="h2"
              className="text-4xl font-bold mb-4"
              field={props.fields.PromoText}
            />
            <ContentSdkRichText tag="div" className="mb-4" field={props.fields.PromoText2} />
          </div>
          <Button
            variant="link"
            size="lg"
            className="font-bold text-xl text-center w-full py-1 px-3 ml-4 mb-4 relative b-0"
            asChild
          >
            {props.fields.PromoLink ? <ContentSdkLink field={props.fields.PromoLink} /> : null}
          </Button>
        </div>
      </div>
    );
  }

  return <PromoDefaultComponent {...props} />;
};

/** Account portal card: section heading + bordered card with icon, title, bullet list, primary CTA */
export const PortalCard = (props: PromoProps): JSX.Element => {
  const id = props.params.RenderingIdentifier;
  if (!props.fields) {
    return <PromoDefaultComponent {...props} />;
  }

  const { PromoIcon, PromoText, PromoText2, PromoText3, PromoLink } = props.fields;

  return (
    <section
      data-class-change
      id={id || undefined}
      className={cn(
        'component promo promo--portal-card mx-auto mb-10 w-full max-w-screen-xl px-4',
        props.params.styles
      )}
    >
      {PromoText3 && (
        <ContentSdkRichText
          tag="h3"
          className="mb-3 text-xl font-bold text-[#333] md:text-2xl"
          field={PromoText3}
        />
      )}
      <div className="rounded-md border border-[#d0d0d0] bg-white p-5 md:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center text-[#2e7d32] md:h-24 md:w-24">
            {hasImageSrc(PromoIcon) ? (
              <ContentSdkImage field={PromoIcon} className="h-full w-full object-contain" />
            ) : (
              <Laptop className="h-16 w-16" strokeWidth={1.25} aria-hidden />
            )}
          </div>
          <div className="min-w-0 flex-1">
            {PromoText && (
              <ContentSdkRichText
                tag="h4"
                className="mb-3 text-lg font-bold text-[#222] md:text-xl"
                field={PromoText}
              />
            )}
            {PromoText2 && (
              <ContentSdkRichText
                tag="div"
                className="mb-4 text-sm leading-relaxed text-[#333] [&_a]:font-semibold [&_a]:text-[#0057a8] [&_a]:underline [&_li]:mb-1 [&_ul]:list-disc [&_ul]:pl-5"
                field={PromoText2}
              />
            )}
            <div className="flex flex-wrap items-center gap-4">
              {PromoLink?.value?.href ? (
                <Button
                  variant="default"
                  className="rounded-sm bg-[#0057a8] px-4 py-2 font-semibold text-white hover:bg-[#004080]"
                  asChild
                >
                  <ContentSdkLink field={PromoLink} />
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/** Location/contact card: section heading + bordered card with icon, copy, CTA, and contact rail */
export const LocationContactCard = (props: PromoProps): JSX.Element => {
  const id = props.params.RenderingIdentifier;
  if (!props.fields) {
    return <PromoDefaultComponent {...props} />;
  }

  const { PromoIcon, PromoText, PromoText2, PromoText3, PromoLink } = props.fields;

  return (
    <section
      data-class-change
      id={id || undefined}
      className={cn(
        'component promo promo--location-contact mx-auto mb-10 w-full max-w-screen-xl px-4',
        props.params.styles
      )}
    >
      {PromoText3 && (
        <ContentSdkRichText
          tag="h3"
          className="mb-3 text-xl font-bold text-[#333] md:text-2xl"
          field={PromoText3}
        />
      )}
      <div className="rounded-md border border-[#d0d0d0] bg-white p-5 md:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e8f5e9] text-[#2e7d32]">
            {hasImageSrc(PromoIcon) ? (
              <ContentSdkImage field={PromoIcon} className="h-full w-full object-cover" />
            ) : (
              <Headset className="h-12 w-12" strokeWidth={1.25} aria-hidden />
            )}
          </div>
          <div className="grid min-w-0 flex-1 gap-6 lg:grid-cols-[1fr_auto] lg:gap-8">
            <div>
              {PromoText && (
                <ContentSdkRichText
                  tag="h4"
                  className="mb-3 text-lg font-bold text-[#222] md:text-xl"
                  field={PromoText}
                />
              )}
              {PromoText2 && (
                <ContentSdkRichText
                  tag="div"
                  className="text-sm leading-relaxed text-[#333] [&_.loc-contact]:mt-4 [&_.loc-contact]:list-none [&_.loc-contact]:space-y-3 [&_.loc-contact]:p-0 [&_.loc-contact]:lg:hidden [&_.loc-desc]:mb-4"
                  field={PromoText2}
                />
              )}
              {PromoLink?.value?.href ? (
                <Button
                  variant="default"
                  className="mt-4 rounded-sm bg-[#0057a8] px-4 py-2 font-semibold text-white hover:bg-[#004080]"
                  asChild
                >
                  <ContentSdkLink field={PromoLink} />
                </Button>
              ) : null}
            </div>
            {PromoText2 && (
              <aside className="hidden border-l border-[#d0d0d0] pl-6 text-sm text-[#333] lg:block">
                <ContentSdkRichText
                  tag="div"
                  className="[&_.loc-body]:contents [&_.loc-contact]:list-none [&_.loc-contact]:space-y-3 [&_.loc-contact]:p-0 [&_.loc-desc]:hidden"
                  field={PromoText2}
                />
              </aside>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
