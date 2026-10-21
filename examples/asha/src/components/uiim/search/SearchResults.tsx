'use client';

import { useEffect, useMemo, useState, type JSX } from 'react';
import type { SearchResultsProps } from './search-results.props';

const TEAL = '#00778B';
const CHIP = '#0E7C86';
const PAGE_SIZE = 10;

const PROFESSIONS = [
  'Audiologists',
  'Speech-Language Pathologists',
  'Assistants',
  'Students',
  'Academic & Faculty',
  'Public',
  'Researchers',
];

const TOPICS = [
  'Augmentative and Alternative Communication (AAC)',
  'Aural Rehabilitation',
  'Autism Spectrum Disorder',
  'Early Intervention',
  'Fluency',
  'Hearing Aids and Cochlear Implants',
  'Language and Literacy',
  'Speech Sound Disorders',
  'Swallowing and Feeding',
  'Voice',
];

const CONTENT_TYPES = ['Articles', 'Books', 'Podcasts', 'Videos', 'Webpages'];
const AUTHORS = ['J. Smith', 'Deborah L. Kelly', 'Maria Santos', 'Priya Nair', 'Owen Price'];
const YEARS = ['2026', '2025', '2024', '2023', '2022'];

type PublishedHit = {
  id?: string;
  name?: string;
  url?: { path?: string };
  pageTitle?: { value?: string };
  navigationTitle?: { value?: string };
  pageSummary?: { value?: string };
  metadataDescription?: { value?: string };
  updated?: { value?: string };
};

type SearchResult = {
  id: string;
  title: string;
  href: string;
  description: string;
  profession: string;
  topic: string;
  contentType: string;
  year: string;
  author: string;
};

const readText = (field?: { value?: string }): string =>
  typeof field?.value === 'string' ? field.value.trim() : '';

const plainText = (value: string): string =>
  value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

const hash = (value: string): number => {
  let total = 0;
  for (let index = 0; index < value.length; index += 1) {
    total = (total + value.charCodeAt(index) * (index + 1)) % 997;
  }
  return total;
};

const classifyProfession = (text: string, id: string): string => {
  const value = text.toLowerCase();
  if (value.includes('audiolog') || value.includes('hearing')) return 'Audiologists';
  if (value.includes('assistant')) return 'Assistants';
  if (value.includes('student') || value.includes('nsslha')) return 'Students';
  if (value.includes('faculty') || value.includes('academic')) return 'Academic & Faculty';
  if (value.includes('research')) return 'Researchers';
  if (value.includes('public')) return 'Public';
  if (value.includes('speech') || value.includes('slp') || value.includes('language')) {
    return 'Speech-Language Pathologists';
  }
  return PROFESSIONS[hash(id) % PROFESSIONS.length];
};

const classifyTopic = (text: string, id: string): string => {
  const value = text.toLowerCase();
  if (value.includes('aac') || value.includes('augmentative')) return TOPICS[0];
  if (value.includes('aural') || value.includes('cochlear') || value.includes('hearing aid'))
    return TOPICS[5];
  if (value.includes('autism')) return TOPICS[2];
  if (value.includes('early intervention')) return TOPICS[3];
  if (value.includes('fluenc')) return TOPICS[4];
  if (value.includes('literacy') || value.includes('language')) return TOPICS[6];
  if (value.includes('speech sound') || value.includes('articulation')) return TOPICS[7];
  if (value.includes('swallow') || value.includes('feeding')) return TOPICS[8];
  if (value.includes('voice')) return TOPICS[9];
  if (value.includes('hearing') || value.includes('audiolog')) return TOPICS[1];
  return TOPICS[hash(id) % TOPICS.length];
};

const classifyContentType = (text: string): string => {
  const value = text.toLowerCase();
  if (value.includes('podcast')) return 'Podcasts';
  if (value.includes('video')) return 'Videos';
  if (value.includes('book')) return 'Books';
  if (
    value.includes('article') ||
    value.includes('news') ||
    value.includes('publication') ||
    value.includes('leader')
  ) {
    return 'Articles';
  }
  return 'Webpages';
};

const classifyYear = (updated: string, id: string): string => {
  const match = updated.match(/^(19|20)\d{2}/);
  if (match && YEARS.includes(match[0])) return match[0];
  return YEARS[hash(id) % YEARS.length];
};

const humanizeName = (value: string): string =>
  value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const toResult = (hit: PublishedHit): SearchResult | null => {
  const href = hit.url?.path?.trim();
  if (!href || href === '/Search' || href.includes('/Data/')) return null;

  const id = hit.id || href;
  const authoredTitle = plainText(hit.pageTitle?.value || hit.navigationTitle?.value || '');
  const title = authoredTitle || humanizeName(hit.name || 'Untitled');
  const description = plainText(hit.pageSummary?.value || hit.metadataDescription?.value || '');
  const basis = `${title} ${href} ${description}`;

  return {
    id,
    title,
    href,
    description: description || `Published page from the ASHA site: ${title}.`,
    profession: classifyProfession(basis, id),
    topic: classifyTopic(basis, id),
    contentType: classifyContentType(basis),
    year: classifyYear(hit.updated?.value || '', id),
    author: AUTHORS[hash(id) % AUTHORS.length],
  };
};

const matchesQuery = (result: SearchResult, query: string): boolean => {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const haystack = [
    result.title,
    result.description,
    result.href,
    result.topic,
    result.profession,
    result.contentType,
    result.author,
  ]
    .join(' ')
    .toLowerCase();
  return terms.every((term) => haystack.includes(term));
};

const score = (result: SearchResult, query: string): number => {
  const term = query.trim().toLowerCase();
  if (!term) return 0;
  const title = result.title.toLowerCase();
  if (title === term) return 4;
  if (title.includes(term)) return 3;
  if (result.topic.toLowerCase().includes(term)) return 2;
  return 1;
};

const fetchPublished = async (): Promise<SearchResult[]> => {
  const response = await fetch('/api/search-results');
  if (!response.ok) throw new Error('Published search did not respond.');

  const payload = (await response.json()) as { results?: PublishedHit[] };
  const seen = new Set<string>();
  const collected: SearchResult[] = [];

  (payload.results ?? []).forEach((hit) => {
    const result = toResult(hit);
    if (!result || seen.has(result.href)) return;
    seen.add(result.href);
    collected.push(result);
  });

  return collected;
};

const FacetGroup = ({
  label,
  options,
  selected,
  counts,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  counts: Map<string, number>;
  onToggle: (value: string) => void;
}) => (
  <fieldset className="mt-5">
    <legend className="text-xs font-semibold tracking-[0.14em] text-[#6b6560] uppercase">
      {label}
    </legend>
    <div className="mt-2 space-y-1.5">
      {options.map((option) => {
        const count = counts.get(option) ?? 0;
        return (
          <label key={option} className="flex items-start gap-2 text-sm text-[#333]">
            <input
              type="checkbox"
              className="mt-1 accent-[#00778B]"
              checked={selected.includes(option)}
              onChange={() => onToggle(option)}
            />
            <span className="min-w-0 flex-1 leading-snug">{option}</span>
            <span className="text-[#8a837c]">{count}</span>
          </label>
        );
      })}
    </div>
  </fieldset>
);

export const Default = (props: SearchResultsProps): JSX.Element => {
  const title = readText(props.fields?.Title) || 'ASHA Website Search';
  const subtitle = readText(props.fields?.Subtitle) || 'Search across all ASHA website content.';
  const prompt = readText(props.fields?.Prompt) || 'What are you looking for?';
  const placeholder = readText(props.fields?.Placeholder) || 'Search ASHA';

  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [professions, setProfessions] = useState<string[]>(PROFESSIONS);
  const [topics, setTopics] = useState<string[]>([]);
  const [contentTypes, setContentTypes] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);
  const [sort, setSort] = useState<'featured' | 'relevance'>('featured');
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    fetchPublished()
      .then((next) => {
        if (cancelled) return;
        setResults(next);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (current: string[], value: string): string[] =>
    current.includes(value) ? current.filter((item) => item !== value) : [...current, value];

  const applyFilters = (
    source: SearchResult[],
    ignore?: 'topic' | 'type' | 'year' | 'author'
  ): SearchResult[] =>
    source.filter((result) => {
      if (!matchesQuery(result, query)) return false;
      if (professions.length !== PROFESSIONS.length && !professions.includes(result.profession))
        return false;
      if (ignore !== 'topic' && topics.length && !topics.includes(result.topic)) return false;
      if (ignore !== 'type' && contentTypes.length && !contentTypes.includes(result.contentType))
        return false;
      if (ignore !== 'year' && years.length && !years.includes(result.year)) return false;
      if (ignore !== 'author' && authors.length && !authors.includes(result.author)) return false;
      return true;
    });

  const filtered = useMemo(() => {
    const next = applyFilters(results);
    if (sort === 'relevance' && query.trim()) {
      return [...next].sort((left, right) => score(right, query) - score(left, query));
    }
    return next;
    // applyFilters closes over the current filter state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authors, contentTypes, professions, query, results, sort, topics, years]);

  const countsFor = (
    ignore: 'topic' | 'type' | 'year' | 'author',
    pick: (result: SearchResult) => string
  ) => {
    const counts = new Map<string, number>();
    applyFilters(results, ignore).forEach((result) => {
      const key = pick(result);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  };

  const topicCounts = countsFor('topic', (result) => result.topic);
  const typeCounts = countsFor('type', (result) => result.contentType);
  const yearCounts = countsFor('year', (result) => result.year);
  const authorCounts = countsFor('author', (result) => result.author);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const start = filtered.length ? (currentPage - 1) * PAGE_SIZE : 0;
  const visible = filtered.slice(start, start + PAGE_SIZE);
  const showingFrom = filtered.length ? start + 1 : 0;
  const showingTo = start + visible.length;

  return (
    <section
      className="bg-white px-4 py-8 text-[#333] sm:px-8"
      data-testid="search-results"
      id={props.params?.RenderingIdentifier}
    >
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-medium" style={{ color: TEAL }}>
          {title}
        </h1>
        <p className="mt-2 text-sm text-[#6b6560]">{subtitle}</p>
        <p className="mt-6 text-sm font-semibold">{prompt}</p>
        <form
          className="mt-2 flex max-w-3xl items-center rounded-md border border-[#cfc9c2] bg-white pr-2"
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(draft);
            setPage(1);
          }}
        >
          <input
            aria-label={placeholder}
            className="min-w-0 flex-1 px-3 py-2 text-sm outline-none"
            placeholder={placeholder}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          {draft ? (
            <button
              type="button"
              aria-label="Clear search"
              className="px-2 text-lg leading-none text-[#8a837c]"
              onClick={() => {
                setDraft('');
                setQuery('');
                setPage(1);
              }}
            >
              ×
            </button>
          ) : null}
          <button type="submit" aria-label="Search" className="px-2" style={{ color: TEAL }}>
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current">
              <circle cx="11" cy="11" r="6.5" strokeWidth="2" />
              <path d="M16 16.5 20 20.5" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <p className="mr-1 text-xs text-[#6b6560]">Filter category: all results by profession</p>
          {PROFESSIONS.map((profession) => {
            const active = professions.includes(profession);
            return (
              <button
                key={profession}
                type="button"
                className="rounded-full px-3 py-1 text-xs"
                style={
                  active
                    ? { backgroundColor: CHIP, color: '#fff' }
                    : { backgroundColor: '#fff', color: CHIP, border: `1px solid ${CHIP}` }
                }
                onClick={() => {
                  setProfessions((current) => toggle(current, profession));
                  setPage(1);
                }}
              >
                {profession}
                {active ? <span className="ml-2">×</span> : null}
              </button>
            );
          })}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[16rem_1fr]">
          <aside>
            <FacetGroup
              label="Topics"
              options={TOPICS}
              selected={topics}
              counts={topicCounts}
              onToggle={(value) => {
                setTopics((current) => toggle(current, value));
                setPage(1);
              }}
            />
            <FacetGroup
              label="Content type"
              options={CONTENT_TYPES}
              selected={contentTypes}
              counts={typeCounts}
              onToggle={(value) => {
                setContentTypes((current) => toggle(current, value));
                setPage(1);
              }}
            />
            <FacetGroup
              label="Publication date"
              options={YEARS}
              selected={years}
              counts={yearCounts}
              onToggle={(value) => {
                setYears((current) => toggle(current, value));
                setPage(1);
              }}
            />
            <FacetGroup
              label="Authors"
              options={AUTHORS}
              selected={authors}
              counts={authorCounts}
              onToggle={(value) => {
                setAuthors((current) => toggle(current, value));
                setPage(1);
              }}
            />
            <div className="mt-8 border border-[#e6e1da] bg-[#f7f4ef] p-3">
              <p className="text-sm font-semibold text-[#16323a]">Hearing from the Experts</p>
              <p className="mt-1 text-xs leading-relaxed text-[#6b6560]">
                Conversations on research and clinical practice.
              </p>
              <p className="mt-3 text-xs font-semibold tracking-[0.08em]" style={{ color: TEAL }}>
                WATCH NOW <span className="font-normal">@ ASHA Stream</span>
              </p>
            </div>
          </aside>

          <div>
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#ece7e1] pb-3">
              <p className="text-sm text-[#6b6560]" data-testid="search-results-summary">
                {status === 'loading'
                  ? 'Searching published content…'
                  : `Results ${showingFrom}–${showingTo} of about ${filtered.length}${query ? ` for ${query}` : ''}`}
              </p>
              <label className="text-xs tracking-[0.12em] text-[#6b6560] uppercase">
                Sort{' '}
                <select
                  className="ml-1 border border-[#cfc9c2] bg-white px-2 py-1 text-xs tracking-normal text-[#333] normal-case"
                  value={sort}
                  onChange={(event) =>
                    setSort(event.target.value === 'relevance' ? 'relevance' : 'featured')
                  }
                >
                  <option value="featured">Featured (default)</option>
                  <option value="relevance">Relevance</option>
                </select>
              </label>
            </div>

            {status === 'error' ? (
              <p className="mt-6 text-sm text-[#6b6560]">
                Published results are not available right now.
              </p>
            ) : null}

            <ol className="mt-4 space-y-6">
              {visible.map((result) => (
                <li key={result.id} data-testid="search-result">
                  <a
                    href={result.href}
                    className="text-lg font-medium no-underline"
                    style={{ color: TEAL }}
                  >
                    {result.title}
                  </a>
                  <p className="mt-1 text-sm leading-relaxed text-[#5c564e]">
                    {result.description}
                  </p>
                  <p className="mt-2 text-xs text-[#6b6560]">
                    <span className="font-semibold">Content:</span> {result.contentType}
                  </p>
                  <p className="text-xs text-[#6b6560]">
                    <span className="font-semibold">Topic:</span> {result.topic}
                  </p>
                  <p className="text-xs text-[#6b6560]">
                    <span className="font-semibold">Practice area:</span> {result.profession}
                  </p>
                </li>
              ))}
            </ol>

            {status === 'ready' && !filtered.length ? (
              <p className="mt-6 text-sm text-[#6b6560]">No published pages match this search.</p>
            ) : null}

            {filtered.length > PAGE_SIZE ? (
              <nav
                aria-label="Search pages"
                className="mt-8 flex items-center justify-center gap-2"
              >
                {currentPage > 1 ? (
                  <button
                    type="button"
                    aria-label="Previous page"
                    className="h-8 px-3 text-sm"
                    onClick={() => setPage(currentPage - 1)}
                  >
                    ←
                  </button>
                ) : null}
                {Array.from(
                  { length: Math.min(6, pageCount) },
                  (_, index) =>
                    Math.min(Math.max(currentPage - 2, 1), Math.max(pageCount - 5, 1)) + index
                )
                  .filter((number) => number >= 1 && number <= pageCount)
                  .map((number) => (
                    <button
                      key={number}
                      type="button"
                      className="h-8 min-w-8 px-2 text-sm"
                      style={
                        number === currentPage
                          ? { backgroundColor: '#E36C1E', color: '#fff' }
                          : { backgroundColor: '#f3f1ee', color: '#333' }
                      }
                      onClick={() => setPage(number)}
                    >
                      {number}
                    </button>
                  ))}
                {currentPage < pageCount ? (
                  <button
                    type="button"
                    aria-label="Next page"
                    className="h-8 px-3 text-sm"
                    onClick={() => setPage(currentPage + 1)}
                  >
                    →
                  </button>
                ) : null}
              </nav>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};
