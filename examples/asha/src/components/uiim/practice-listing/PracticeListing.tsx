'use client';

import { useEffect, useState, type JSX } from 'react';
import { Text, useSitecore } from '@sitecore-content-sdk/nextjs';
import { findDemoGuest } from '@/demo/demo-guests';
import { DEMO_GUEST_CHANGED_EVENT, DEMO_GUEST_STORAGE_KEY } from '@/demo/guest-session';
import { cn } from '@/lib/utils';
import { canViewPracticePage } from './practice-access.util';
import type { PracticeListingProps, PracticeListingVariant, PracticeTopic } from './practice-listing.props';

const readGuestStatus = (): string | null => {
  if (typeof window === 'undefined') return null;
  return findDemoGuest(window.localStorage.getItem(DEMO_GUEST_STORAGE_KEY))?.certificationStatus ?? null;
};

const PracticeListingEmpty = (): JSX.Element => (
  <section className="mx-auto w-full max-w-5xl px-4 py-8" data-testid="practice-listing-empty">
    <p className="text-sm text-[#5c564e]">Practice listing is not configured.</p>
  </section>
);

const TopicLink = ({ topic }: { topic: PracticeTopic }): JSX.Element => (
  <a className="font-semibold text-[#00778B] no-underline hover:underline" href={topic.href}>
    {topic.title}
  </a>
);

const AccessLabels = ({ access }: { access: string[] }): JSX.Element | null => {
  if (access.length === 0) return null;

  return (
    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#5c564e]">{access.join(' · ')}</p>
  );
};

const PracticeListingView = ({
  props,
  variant,
}: {
  props: PracticeListingProps;
  variant: PracticeListingVariant;
}): JSX.Element => {
  const { page } = useSitecore();
  const isEditing = page?.mode?.isEditing;
  const [status, setStatus] = useState<string | null>(null);
  const [topics, setTopics] = useState<PracticeTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const applyGuest = () => setStatus(readGuestStatus());
    applyGuest();
    window.addEventListener(DEMO_GUEST_CHANGED_EVENT, applyGuest);
    window.addEventListener('pageshow', applyGuest);

    let ignore = false;
    fetch('/api/practice-listing', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : { topics: [] }))
      .then((payload: { topics?: PracticeTopic[] }) => {
        if (!ignore) setTopics(payload.topics ?? []);
      })
      .catch(() => {
        if (!ignore) setTopics([]);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
      window.removeEventListener(DEMO_GUEST_CHANGED_EVENT, applyGuest);
      window.removeEventListener('pageshow', applyGuest);
    };
  }, []);

  const visible = topics.filter((topic) => canViewPracticePage(topic.access, status));
  const title = props.fields?.Title;
  const intro = props.fields?.Intro;

  return (
    <section
      className={cn('mx-auto w-full max-w-5xl px-4 py-10', props.params?.styles)}
      id={props.params?.RenderingIdentifier}
      data-testid="practice-listing"
      data-variant={variant}
    >
      {(title?.value || isEditing) && <Text field={title} tag="h2" className="text-2xl font-semibold text-[#1f1a17]" />}
      {(intro?.value || isEditing) && (
        <Text field={intro} tag="p" className="mt-2 max-w-3xl text-sm text-[#5c564e]" />
      )}
      <p className="mt-4 text-xs uppercase tracking-[0.14em] text-[#0E7C86]" data-testid="practice-listing-status">
        {status ? `Showing topics for ${status}` : 'Showing public topics'}
      </p>
      {isLoading ? <p className="mt-6 text-sm text-[#5c564e]">Loading practice topics.</p> : null}
      {!isLoading && visible.length === 0 ? (
        <p className="mt-6 text-sm text-[#5c564e]" data-testid="practice-listing-none">
          No practice topics match this profile.
        </p>
      ) : null}
      {variant === 'cards' ? (
        <ul className="mt-6 grid list-none gap-4 p-0 sm:grid-cols-2">
          {visible.map((topic) => (
            <li key={topic.id} className="border border-[#d7d1c8] bg-white p-5" data-testid="practice-topic">
              <TopicLink topic={topic} />
              {topic.summary ? <p className="mt-2 text-sm text-[#5c564e]">{topic.summary}</p> : null}
              <AccessLabels access={topic.access} />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-6 list-none space-y-3 p-0">
          {visible.map((topic) => (
            <li key={topic.id} className="border-b border-[#ece7e1] pb-3" data-testid="practice-topic">
              <TopicLink topic={topic} />
              {topic.summary ? <p className="mt-1 text-sm text-[#5c564e]">{topic.summary}</p> : null}
              <AccessLabels access={topic.access} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export const Default = (props: PracticeListingProps): JSX.Element => {
  if (!props.fields && !props.rendering) return <PracticeListingEmpty />;
  return <PracticeListingView props={props} variant="list" />;
};

export const Cards = (props: PracticeListingProps): JSX.Element => {
  if (!props.fields && !props.rendering) return <PracticeListingEmpty />;
  return <PracticeListingView props={props} variant="cards" />;
};
