'use client';

import type { JSX } from 'react';
import { Image, Link, Text } from '@sitecore-content-sdk/nextjs';
import type { ImageField } from '@sitecore-content-sdk/nextjs';
import { getFieldValue } from '@/lib/component-props';
import { cn } from '@/lib/utils';
import { NoDataFallback } from '@/utils/NoDataFallback';
import type { EventBannerEvent, EventBannerImage, EventBannerProps } from './event-banner.props';
import { formatSchedule } from './EventListing';

const TITLE_COLOR = '#00778B';

const fieldText = (field?: { jsonValue?: { value?: unknown }; value?: unknown }): string => {
  const value = getFieldValue(field)?.value ?? field?.value;
  return typeof value === 'string' ? value.trim() : '';
};

const dateValue = (field?: { value?: string; jsonValue?: { value?: unknown } }): string => {
  if (typeof field?.value === 'string' && field.value.trim()) return field.value.trim();
  const jsonValue = field?.jsonValue?.value;
  return typeof jsonValue === 'string' ? jsonValue.trim() : '';
};

const xmlAttribute = (xml: string, name: string): string => {
  const match = xml.match(new RegExp(`${name}="([^"]*)"`, 'i'));
  return (match?.[1] ?? '').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
};

const imageFieldFrom = (image?: EventBannerImage): ImageField | undefined => {
  if (!image) return undefined;
  if ('jsonValue' in image && image.jsonValue?.value?.src) return image.jsonValue;

  const raw = 'value' in image ? image.value : undefined;
  if (typeof raw === 'string') {
    const src = xmlAttribute(raw, 'src');
    if (!src) return undefined;
    return { value: { src, alt: xmlAttribute(raw, 'alt') } };
  }
  if (raw && typeof raw === 'object' && typeof raw.src === 'string' && raw.src) {
    return { value: raw };
  }
  return undefined;
};

const EventBannerLayout = ({ event, imageSide }: { event: EventBannerEvent; imageSide: 'left' | 'right' }): JSX.Element => {
  const nameField = getFieldValue(event.eventName);
  const descriptionField = getFieldValue(event.eventDescription);
  const linkField = getFieldValue(event.eventLink);
  const imageField = imageFieldFrom(event.eventImage);
  const place = fieldText(event.eventPlace);
  const schedule = formatSchedule(dateValue(event.eventStart), dateValue(event.eventEnd));
  const href = typeof linkField?.value?.href === 'string' ? linkField.value.href : '';

  return (
    <div className="grid min-h-[28rem] grid-cols-1 @lg:grid-cols-2" data-image-side={imageSide}>
      <div className={cn('relative min-h-72 bg-[#e7e2d8]', imageSide === 'right' && '@lg:order-2')}>
        {imageField ? (
          <Image field={imageField} className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="flex flex-col justify-center bg-white px-8 py-12 sm:px-14 lg:px-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#991E66]">Event</p>
        <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl" style={{ color: TITLE_COLOR }}>
          {nameField?.value ? <Text field={nameField} /> : event.name}
        </h2>
        {place ? <p className="mt-4 text-lg text-[#5c564e]">{place}</p> : null}
        {schedule ? <p className="mt-1 text-lg text-[#5c564e]">{schedule}</p> : null}
        {descriptionField?.value ? (
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[#5c564e]">
            <Text field={descriptionField} />
          </p>
        ) : null}
        {linkField && href ? (
          <Link
            field={linkField}
            className="mt-8 inline-flex w-fit bg-[#0E7C86] px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white no-underline"
          >
            {linkField.value?.text || 'Learn more'}
          </Link>
        ) : null}
      </div>
    </div>
  );
};

const EventBannerView = (props: EventBannerProps): JSX.Element => {
  const event = props.fields?.data?.datasource;
  if (!event) return <NoDataFallback componentName="EventBanner" />;

  return (
    <section
      className={cn('@container w-full', props.params?.styles)}
      id={props.params?.RenderingIdentifier}
      data-testid="event-banner"
    >
      <EventBannerLayout event={event} imageSide={props.imageSide ?? 'left'} />
    </section>
  );
};

export const Default = (props: EventBannerProps): JSX.Element => <EventBannerView {...props} imageSide="left" />;

export const ImageLeft = (props: EventBannerProps): JSX.Element => <EventBannerView {...props} imageSide="left" />;

export const ImageRight = (props: EventBannerProps): JSX.Element => <EventBannerView {...props} imageSide="right" />;
