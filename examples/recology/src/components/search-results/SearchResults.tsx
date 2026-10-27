'use client';

import { useMemo, useState, useEffect, type FormEvent } from 'react';
import { Text, useSitecore } from '@sitecore-content-sdk/nextjs';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getDatasource, getFieldValue } from '@/lib/component-props';
import {
  facetCounts,
  findQaAnswers,
  getSearchPack,
  rankSearchPackItems,
  searchPackItems,
} from '@/lib/search-packs';
import type { SearchResultItem, ScoredSearchResult } from '@/lib/search-packs';
import { cn } from '@/lib/utils';
import { NoDataFallback } from '@/utils/NoDataFallback';
import type { SearchResultsProps } from './search-results.props';

const PAGE_SIZE = 9;

const fieldText = (field?: { value?: string } | FieldLike): string => {
  if (!field) return '';
  if (typeof field === 'object' && 'value' in field && typeof field.value === 'string') {
    return field.value;
  }
  return '';
};

type FieldLike = { value?: string };

const ResultCard = ({ item }: { item: SearchResultItem }) => (
  <article className="flex h-full flex-col border border-border bg-background p-5 shadow-sm transition hover:border-primary/40">
    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">{item.type}</p>
    <h3 className="mb-2 text-lg font-semibold text-foreground">
      <a href={item.href} className="hover:underline">
        {item.title}
      </a>
    </h3>
    <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">{item.summary}</p>
    <a href={item.href} className="text-sm font-medium text-primary hover:underline">
      Read more
    </a>
  </article>
);

const QaAnswerPanel = ({ items }: { items: ScoredSearchResult[] }) => {
  if (!items.length) return null;

  return (
    <div className="mb-8 space-y-4" data-testid="search-qa-answers">
      {items.map((item) => (
        <article
          key={item.id}
          className="border border-primary/30 bg-primary/5 p-6"
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
            Question &amp; answer
          </p>
          <h2 className="mb-3 text-xl font-semibold text-foreground lg:text-2xl">{item.title}</h2>
          <p className="mb-4 max-w-3xl text-sm leading-relaxed text-foreground/90 lg:text-base">
            {item.answer}
          </p>
          {item.relatedLinks?.length ? (
            <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-2">
              {item.relatedLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-sm font-medium text-primary hover:underline">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          <a href={item.href} className="text-sm font-semibold text-primary hover:underline">
            Open full answer
          </a>
        </article>
      ))}
    </div>
  );
};

const FacetGroup = ({
  title,
  options,
  selected,
  onSelect,
}: {
  title: string;
  options: Array<{ value: string; count: number }>;
  selected?: string;
  onSelect: (value?: string) => void;
}) => (
  <div className="border-b border-border py-4 last:border-b-0">
    <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-foreground">{title}</h3>
    <ul className="space-y-2">
      {options.map((option) => {
        const isActive = selected === option.value;
        return (
          <li key={option.value}>
            <button
              type="button"
              onClick={() => onSelect(isActive ? undefined : option.value)}
              className={cn(
                'flex w-full items-center justify-between text-left text-sm',
                isActive ? 'font-semibold text-primary' : 'text-foreground hover:text-primary'
              )}
            >
              <span>{option.value}</span>
              <span className="text-muted-foreground">({option.count})</span>
            </button>
          </li>
        );
      })}
    </ul>
  </div>
);

export const Default = (props: SearchResultsProps) => {
  const fields = getDatasource(props.fields);
  const { page } = useSitecore();
  const siteName =
    (page as { siteName?: string } | undefined)?.siteName ||
    (page?.layout?.sitecore?.context?.site as { name?: string } | undefined)?.name ||
    process.env.NEXT_PUBLIC_DEFAULT_SITE_NAME ||
    'recology';
  const pack = useMemo(() => getSearchPack(siteName), [siteName]);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [draft, setDraft] = useState(initialQuery);
  const [topic, setTopic] = useState<string | undefined>();
  const [type, setType] = useState<string | undefined>();
  const [sort, setSort] = useState<'relevance' | 'title'>('relevance');
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    setQuery(initialQuery);
    setDraft(initialQuery);
    setPageIndex(0);
  }, [initialQuery]);

  const titleField = getFieldValue(fields?.Title);
  const subtitleField = getFieldValue(fields?.Subtitle);
  const placeholder =
    fieldText(getFieldValue(fields?.Placeholder)) ||
    fieldText(fields?.Placeholder as FieldLike) ||
    'Search Recology';

  const ranked = useMemo(
    () => rankSearchPackItems(pack, query, { topic, type }),
    [pack, query, topic, type]
  );

  const filtered = useMemo(() => {
    if (sort === 'title') {
      return [...ranked].sort((a, b) => a.title.localeCompare(b.title));
    }
    return ranked;
  }, [ranked, sort]);

  const qaAnswers = useMemo(() => findQaAnswers(pack, query, 2), [pack, query]);

  const topicFacets = useMemo(() => facetCounts(searchPackItems(pack, query, { type }), 'topic'), [pack, query, type]);
  const typeFacets = useMemo(() => facetCounts(searchPackItems(pack, query, { topic }), 'type'), [pack, query, topic]);

  const qaIds = new Set(qaAnswers.map((item) => item.id));
  // Keep Q&A cards out of the grid when they already appear in the answer panel.
  const listItems = filtered.filter((item) => !qaIds.has(item.id));
  const total = listItems.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(pageIndex, pageCount - 1);
  const pageItems = listItems.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const featured = !query && !topic && !type ? listItems.find((item) => item.featured) : undefined;
  const gridItems = featured ? pageItems.filter((item) => item.id !== featured.id) : pageItems;
  const rangeStart = total === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const rangeEnd = Math.min(total, (safePage + 1) * PAGE_SIZE);

  const submitSearch = (event?: FormEvent) => {
    event?.preventDefault();
    const next = draft.trim();
    setQuery(next);
    setPageIndex(0);
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set('q', next);
    else params.delete('q');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  if (!fields) {
    return <NoDataFallback componentName="SearchResults" />;
  }

  return (
    <section className={cn('w-full', props.params?.styles)} data-testid="search-results" data-class-change>
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4 py-14 text-center lg:px-6 lg:py-20">
          {(titleField?.value || page?.mode?.isEditing) && (
            <Text
              field={titleField}
              tag="h1"
              className="mb-3 text-3xl font-bold tracking-tight lg:text-5xl"
            />
          )}
          {(subtitleField?.value || page?.mode?.isEditing) && (
            <Text field={subtitleField} tag="p" className="mx-auto mb-8 max-w-2xl text-base text-primary-foreground/90" />
          )}
          <form
            role="search"
            onSubmit={submitSearch}
            className="mx-auto flex max-w-2xl overflow-hidden rounded-full border border-primary-foreground/20 bg-background shadow-lg"
          >
            <label className="flex flex-1 items-center gap-2 px-4">
              <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
              <input
                type="search"
                name="q"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={placeholder}
                aria-label={placeholder}
                className="h-12 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </label>
            <button type="submit" className="m-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">
              Search
            </button>
          </form>
          {!query && pack.popularSearches.length > 0 ? (
            <ul className="mt-5 flex flex-wrap justify-center gap-2">
              {pack.popularSearches.map((term) => (
                <li key={term}>
                  <button
                    type="button"
                    className="rounded-full border border-primary-foreground/30 px-3 py-1 text-xs text-primary-foreground hover:bg-primary-foreground/10"
                    onClick={() => {
                      setDraft(term);
                      setQuery(term);
                      setPageIndex(0);
                      router.replace(`${pathname}?q=${encodeURIComponent(term)}`, { scroll: false });
                    }}
                  >
                    {term}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:px-6">
        <aside aria-label="Refine results" className="lg:sticky lg:top-6 lg:self-start">
          <h2 className="mb-2 text-base font-bold text-foreground">Refine by</h2>
          <FacetGroup title="Topic" options={topicFacets} selected={topic} onSelect={(value) => { setTopic(value); setPageIndex(0); }} />
          <FacetGroup title="Resource type" options={typeFacets} selected={type} onSelect={(value) => { setType(value); setPageIndex(0); }} />
          {(topic || type) && (
            <button
              type="button"
              className="mt-3 text-sm text-primary hover:underline"
              onClick={() => {
                setTopic(undefined);
                setType(undefined);
                setPageIndex(0);
              }}
            >
              Clear filters
            </button>
          )}
        </aside>

        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {total === 0
                ? 'No results'
                : `Showing ${rangeStart}-${rangeEnd} of ${total} results`}
              {query ? (
                <>
                  {' '}
                  for <span className="font-medium text-foreground">&ldquo;{query}&rdquo;</span>
                </>
              ) : null}
            </p>
            <label className="flex items-center gap-2 text-sm text-foreground">
              Sort by
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as 'relevance' | 'title')}
                className="border border-border bg-background px-2 py-1.5 text-sm"
              >
                <option value="relevance">Relevance</option>
                <option value="title">Title</option>
              </select>
            </label>
          </div>

          {qaAnswers.length > 0 ? <QaAnswerPanel items={qaAnswers} /> : null}

          {featured && !qaAnswers.some((item) => item.id === featured.id) ? (
            <article className="mb-6 border border-border bg-muted/30 p-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">Featured</p>
              <h2 className="mb-2 text-2xl font-semibold text-foreground">
                <a href={featured.href} className="hover:underline">
                  {featured.title}
                </a>
              </h2>
              <p className="mb-4 max-w-3xl text-sm text-muted-foreground">{featured.summary}</p>
              <a href={featured.href} className="text-sm font-medium text-primary hover:underline">
                Read more
              </a>
            </article>
          ) : null}

          {gridItems.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {gridItems.map((item) => (
                <ResultCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-border px-6 py-16 text-center">
              <p className="mb-2 text-lg font-semibold text-foreground">No matching pages</p>
              <p className="text-sm text-muted-foreground">
                Try another search or clear filters to browse Recology resources.
              </p>
            </div>
          )}

          {pageCount > 1 ? (
            <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Search pagination">
              <button
                type="button"
                className="inline-flex size-9 items-center justify-center border border-border disabled:opacity-40"
                disabled={safePage === 0}
                onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
              </button>
              {Array.from({ length: pageCount }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setPageIndex(index)}
                  className={cn(
                    'inline-flex size-9 items-center justify-center border text-sm',
                    index === safePage
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-foreground hover:border-primary'
                  )}
                  aria-current={index === safePage ? 'page' : undefined}
                >
                  {index + 1}
                </button>
              ))}
              <button
                type="button"
                className="inline-flex size-9 items-center justify-center border border-border disabled:opacity-40"
                disabled={safePage >= pageCount - 1}
                onClick={() => setPageIndex((current) => Math.min(pageCount - 1, current + 1))}
                aria-label="Next page"
              >
                <ChevronRight className="size-4" />
              </button>
            </nav>
          ) : null}
        </div>
      </div>
    </section>
  );
};
