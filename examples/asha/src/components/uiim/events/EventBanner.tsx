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

  const details = [place, schedule].filter(Boolean).join(' · ');

  return (
    <div className="grid h-[9.24rem] grid-cols-[7.5rem_1fr] @md:grid-cols-[11.5rem_1fr]" data-image-side={imageSide}>
      <div className={cn('relative h-full min-w-0 overflow-hidden bg-[#e7e2d8]', imageSide === 'right' && 'order-2')}>
        {imageField ? (
          <Image field={imageField} className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="flex min-w-0 items-center bg-white px-4 @md:px-6">
        <div className="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-2">
          <div className="min-w-0 max-w-xl">
            <p className="text-[10px] font-semibold uppercase leading-none tracking-[0.16em] text-[#991E66]">Event</p>
            <h2 className="mt-1 truncate text-base font-semibold leading-tight @md:text-lg" style={{ color: TITLE_COLOR }}>
              {nameField?.value ? <Text field={nameField} /> : event.name}
            </h2>
            {details ? <p className="mt-0.5 truncate text-xs text-[#5c564e] @md:text-sm">{details}</p> : null}
            {descriptionField?.value ? (
              <p className="mt-0.5 hidden truncate text-xs text-[#5c564e] @md:block">
                <Text field={descriptionField} />
              </p>
            ) : null}
          </div>
          {linkField && href ? (
            <Link
              field={linkField}
              className="inline-flex shrink-0 bg-[#0E7C86] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white no-underline"
            >
              {linkField.value?.text || 'Learn more'}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const eventFromFields = (fields?: EventBannerProps['fields']): EventBannerEvent | undefined => {
  if (fields?.data?.datasource) return fields.data.datasource;
  if (!fields?.EventName && !fields?.EventPlace && !fields?.EventDescription && !fields?.eventImage) return undefined;

  return {
    eventName: fields.EventName,
    eventPlace: fields.EventPlace,
    eventDescription: fields.EventDescription,
    eventStart: fields.EventStart,
    eventEnd: fields.EventEnd,
    eventLink: fields.EventLink,
    eventImage: fields.eventImage,
  };
};

const EventBannerView = (props: EventBannerProps): JSX.Element => {
  const event = eventFromFields(props.fields);
  if (!event) return <NoDataFallback componentName="EventBanner" />;

  return (
    <section
      className={cn('@container w-full pt-8', props.params?.styles)}
      id={props.params?.RenderingIdentifier}
      data-testid="event-banner"
    >
    <div className="mx-auto w-[70%] overflow-hidden">
        <EventBannerLayout event={event} imageSide={props.imageSide ?? 'left'} />
      </div>
    </section>
  );
};

export const Default = (props: EventBannerProps): JSX.Element => <EventBannerView {...props} imageSide="left" />;

export const ImageLeft = (props: EventBannerProps): JSX.Element => <EventBannerView {...props} imageSide="left" />;

export const ImageRight = (props: EventBannerProps): JSX.Element => <EventBannerView {...props} imageSide="right" />;
