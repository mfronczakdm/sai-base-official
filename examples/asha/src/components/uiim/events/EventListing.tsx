'use client';

import type { JSX } from 'react';
import { Text } from '@sitecore-content-sdk/nextjs';
import { getFieldValue } from '@/lib/component-props';
import { cn } from '@/lib/utils';
import { NoDataFallback } from '@/utils/NoDataFallback';
import type { EventListingItem, EventListingProps } from './event-listing.props';

const TITLE_COLOR = '#00778B';
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

type Clock = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

const fieldText = (field?: { jsonValue?: { value?: unknown }; value?: unknown }): string => {
  const value = getFieldValue(field)?.value ?? field?.value;
  return typeof value === 'string' ? value.trim() : '';
};

const dateValue = (field?: { value?: string; jsonValue?: { value?: unknown } }): string => {
  if (typeof field?.value === 'string' && field.value.trim()) return field.value.trim();
  const jsonValue = field?.jsonValue?.value;
  return typeof jsonValue === 'string' ? jsonValue.trim() : '';
};

const parseClock = (value: string): Clock | undefined => {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
  if (!match) return undefined;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
  };
};

const formatDate = (clock: Clock): string => `${MONTHS[clock.month - 1]} ${clock.day}, ${clock.year}`;

const formatTime = (clock: Clock): string => {
  const suffix = clock.hour >= 12 ? 'p.m.' : 'a.m.';
  const hour = clock.hour % 12 || 12;
  if (clock.minute === 0) return `${hour} ${suffix}`;
  return `${hour}:${clock.minute.toString().padStart(2, '0')} ${suffix}`;
};

const hasTime = (clock?: Clock): boolean => Boolean(clock && (clock.hour !== 0 || clock.minute !== 0));

const sameDay = (left: Clock, right: Clock): boolean =>
  left.year === right.year && left.month === right.month && left.day === right.day;

export const formatSchedule = (startValue?: string, endValue?: string): string => {
  const start = startValue ? parseClock(startValue) : undefined;
  const end = endValue ? parseClock(endValue) : undefined;
  if (!start) return '';

  const date = formatDate(start);
  if (!end || sameDay(start, end)) {
    if (!hasTime(start) && !hasTime(end)) return date;
    if (end && hasTime(end) && start.hour >= 12 === end.hour >= 12) {
      const startLabel = formatTime(start).replace(/ [ap]\.m\.$/, '');
      return `${date} · ${startLabel}–${formatTime(end)}`;
    }
    return end && hasTime(end) ? `${date} · ${formatTime(start)}–${formatTime(end)}` : `${date} · ${formatTime(start)}`;
  }

  const range = `${formatDate(start)} – ${formatDate(end)}`;
  if (!hasTime(start) && !hasTime(end)) return range;
  return `${range} · ${formatTime(start)}–${formatTime(end)}`;
};

const eventHref = (item: EventListingItem): string => {
  const link = getFieldValue(item.eventLink)?.value;
  return typeof link?.href === 'string' ? link.href : '';
};

const eventTitle = (item: EventListingItem, parent?: EventListingItem): string =>
  fieldText(item.eventName) || fieldText(item.title) || fieldText(parent?.title) || item.name || parent?.name || '';

const toCards = (item: EventListingItem): EventListingItem[] => {
  const children = item.children?.results?.filter((child) => eventTitle(child, item) || fieldText(child.eventPlace)) ?? [];
  return children.length > 0 ? children.map((child) => ({ ...child, title: child.title ?? item.title })) : [item];
};

const EventCard = ({ item, parent }: { item: EventListingItem; parent?: EventListingItem }): JSX.Element => {
  const title = eventTitle(item, parent);
  const titleField = getFieldValue(item.eventName) || getFieldValue(item.title) || getFieldValue(parent?.title);
  const place = fieldText(item.eventPlace);
  const schedule = formatSchedule(dateValue(item.eventStart), dateValue(item.eventEnd));
  const href = eventHref(item);
  const className = 'flex h-full flex-col border border-[#e6e6e6] bg-white p-3 no-underline shadow-sm';
  const body = (
    <>
      <h3 className="text-left text-base font-medium leading-snug" style={{ color: TITLE_COLOR }}>
        {titleField?.value ? <Text field={titleField} /> : title}
      </h3>
      {place ? <p className="mt-2 text-sm text-[#5c564e]">{place}</p> : null}
      {schedule ? <p className="mt-1 text-sm text-[#5c564e]">{schedule}</p> : null}
    </>
  );

  if (!href) {
    return (
      <article className={className} data-testid="event-listing-card">
        {body}
      </article>
    );
  }

  return (
    <a href={href} className={className} data-testid="event-listing-card">
      {body}
    </a>
  );
};

export const Default = (props: EventListingProps): JSX.Element => {
  const datasource = props.fields?.data?.datasource;

  if (!datasource) {
    return <NoDataFallback componentName="EventListing" />;
  }

  const selected = datasource.events?.targetItems?.filter(Boolean) ?? [];
  const cards = selected.flatMap((item) => toCards(item).map((card) => ({ card, parent: item })));
  const titleField = getFieldValue(datasource.title);

  return (
    <section
      className={cn('@container px-4 py-8 sm:px-8', props.params?.styles)}
      id={props.params?.RenderingIdentifier}
      data-testid="event-listing"
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-5 w-fit border-b-[3px] border-[#991E66] pb-1 text-sm font-semibold uppercase tracking-[0.16em] text-[#6d645b]">
          {titleField?.value ? <Text field={titleField} /> : 'EVENTS'}
        </h2>
        {cards.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 @md:grid-cols-3">
            {cards.map(({ card, parent }) => (
              <EventCard key={card.id || eventTitle(card, parent)} item={card} parent={parent} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#6d645b]">Select events from Data/Events.</p>
        )}
      </div>
    </section>
  );
};
