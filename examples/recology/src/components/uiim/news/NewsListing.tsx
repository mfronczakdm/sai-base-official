'use client';

import type { JSX, ReactNode } from 'react';
import { Text } from '@sitecore-content-sdk/nextjs';
import { getFieldValue } from '@/lib/component-props';
import { cn } from '@/lib/utils';
import { NoDataFallback } from '@/utils/NoDataFallback';
import type {
  NewsListingArticle,
  NewsListingDatasource,
  NewsListingProps,
} from './news-listing.props';

const SUMMARY_MAX = 140;

const fieldText = (field?: { jsonValue?: { value?: unknown }; value?: unknown }): string => {
  const value = getFieldValue(field)?.value ?? field?.value;
  return typeof value === 'string' ? value.trim() : '';
};

const isAccent = (article: NewsListingArticle): boolean => {
  const value = getFieldValue(article.titleAccent)?.value ?? article.titleAccent?.jsonValue?.value;
  return value === true || value === '1';
};

const isArticle = (article?: NewsListingArticle): article is NewsListingArticle =>
  Boolean(fieldText(article?.pageTitle) || fieldText(article?.pageHeaderTitle));

const articleTitle = (article: NewsListingArticle): string =>
  fieldText(article.pageTitle) || fieldText(article.pageHeaderTitle) || article.name || '';

const articleHref = (article: NewsListingArticle): string => {
  const link = getFieldValue(article.sourceLink)?.value;
  if (typeof link?.href === 'string' && link.href) return link.href;
  return article.url?.path || '#';
};

const articleImage = (article: NewsListingArticle): { src: string; alt: string } => {
  const image =
    getFieldValue(article.image)?.value || getFieldValue(article.pageThumbnail)?.value;
  return {
    src: typeof image?.src === 'string' ? image.src : '',
    alt: typeof image?.alt === 'string' && image.alt ? image.alt : articleTitle(article),
  };
};

const articleSummary = (article: NewsListingArticle): string => {
  const summary = fieldText(article.pageSummary);
  if (!summary) return '';
  if (summary.length <= SUMMARY_MAX) return summary;
  return `${summary.slice(0, SUMMARY_MAX).replace(/\s+\S*$/, '')} [...]`;
};

const resolveArticles = (datasource: NewsListingDatasource): NewsListingArticle[] => {
  const selected = datasource.articles?.targetItems?.filter(isArticle) ?? [];
  if (selected.length > 0) return selected;

  const children = datasource.children?.results?.filter(isArticle) ?? [];
  if (children.length > 0) return children;

  return isArticle(datasource) ? [datasource] : [];
};

const moreLink = (
  datasource: NewsListingDatasource
): { href: string; text: string } => {
  const link = getFieldValue(datasource.link)?.value;
  return {
    href: typeof link?.href === 'string' && link.href ? link.href : '/News',
    text: typeof link?.text === 'string' && link.text ? link.text : 'Read More News',
  };
};

/** Compact ASHA-style card (title + optional thumb). */
const CompactNewsCard = ({ article }: { article: NewsListingArticle }): JSX.Element => {
  const titleField = getFieldValue(article.pageTitle) || getFieldValue(article.pageHeaderTitle);
  const image = articleImage(article);
  const accent = isAccent(article);

  return (
    <a
      href={articleHref(article)}
      className="flex h-full flex-col border border-border bg-card p-3 no-underline shadow-sm"
      data-testid="news-listing-card"
    >
      {image.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image.src} alt={image.alt} className="aspect-[350/200] w-full object-cover" />
      ) : null}
      <h3
        className={cn(
          'mt-2.5 text-left text-base font-medium leading-snug',
          accent ? 'text-secondary' : 'text-primary'
        )}
      >
        <Text field={titleField} />
      </h3>
    </a>
  );
};

/** Recology.com-style card: full-bleed image, bold title, grey summary. */
const ImageNewsCard = ({ article }: { article: NewsListingArticle }): JSX.Element => {
  const titleField = getFieldValue(article.pageTitle) || getFieldValue(article.pageHeaderTitle);
  const image = articleImage(article);
  const summary = articleSummary(article);

  return (
    <a
      href={articleHref(article)}
      className="group flex h-full flex-col overflow-hidden rounded-sm border border-[#d9d9d9] bg-white text-inherit no-underline shadow-sm transition-shadow hover:shadow-md"
      data-testid="news-listing-image-card"
    >
      <div className="bg-muted aspect-[16/10] w-full overflow-hidden">
        {image.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.src}
            alt={image.alt}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary/20 text-sm text-muted-foreground">
            News
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 px-5 py-5">
        <h3 className="text-foreground text-left text-base font-bold leading-snug @md:text-lg">
          <Text field={titleField} />
        </h3>
        {summary ? (
          <p className="text-muted-foreground text-left text-sm leading-relaxed">{summary}</p>
        ) : null}
      </div>
    </a>
  );
};

const ListingShell = ({
  props,
  articles,
  heading,
  titleField,
  variant,
  children,
  footer,
}: {
  props: NewsListingProps;
  articles: NewsListingArticle[];
  heading: string;
  titleField?: { value?: string };
  variant: 'default' | 'image-cards';
  children: ReactNode;
  footer?: ReactNode;
}): JSX.Element => (
  <section
    className={cn('@container px-4 py-10 sm:px-8', props.params?.styles)}
    id={props.params?.RenderingIdentifier}
    data-testid="news-listing"
    data-variant={variant}
  >
    <div className="mx-auto max-w-6xl">
      <h2
        className={cn(
          'mb-6 text-foreground',
          variant === 'image-cards'
            ? 'text-2xl font-semibold tracking-tight @md:text-3xl'
            : 'w-fit border-b-[3px] border-secondary pb-1 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground'
        )}
      >
        {titleField?.value ? <Text field={titleField} /> : heading}
      </h2>
      {articles.length > 0 ? (
        children
      ) : (
        <p className="text-sm text-muted-foreground">Select articles from News.</p>
      )}
      {footer}
    </div>
  </section>
);

export const Default = (props: NewsListingProps): JSX.Element => {
  const datasource = props.fields?.data?.datasource;

  if (!datasource) {
    return <NoDataFallback componentName="NewsListing" />;
  }

  const selected = datasource.articles?.targetItems?.filter(isArticle) ?? [];
  const articles = resolveArticles(datasource);
  const heading = selected.length > 0 ? fieldText(datasource.title) || 'NEWS' : 'NEWS';
  const titleField = selected.length > 0 ? getFieldValue(datasource.title) : undefined;

  return (
    <ListingShell
      props={props}
      articles={articles}
      heading={heading}
      titleField={titleField}
      variant="default"
    >
      <div className="grid grid-cols-1 gap-5 @md:grid-cols-3">
        {articles.map((article) => (
          <CompactNewsCard key={article.id || articleHref(article)} article={article} />
        ))}
      </div>
    </ListingShell>
  );
};

/** Recology homepage news grid with images, summaries, and Read More CTA. */
export const ImageCards = (props: NewsListingProps): JSX.Element => {
  const datasource = props.fields?.data?.datasource;

  if (!datasource) {
    return <NoDataFallback componentName="NewsListing" />;
  }

  const articles = resolveArticles(datasource).slice(0, 3);
  const heading = fieldText(datasource.title) || 'News';
  const titleField = getFieldValue(datasource.title);
  const cta = moreLink(datasource);

  return (
    <ListingShell
      props={props}
      articles={articles}
      heading={heading}
      titleField={titleField}
      variant="image-cards"
      footer={
        articles.length > 0 ? (
          <div className="mt-8 flex justify-center">
            <a
              href={cta.href}
              className="btn btn-outline border-primary text-primary hover:bg-primary hover:text-primary-foreground px-6 py-2.5 text-sm font-medium"
              data-testid="news-listing-more"
            >
              {cta.text}
            </a>
          </div>
        ) : null
      }
    >
      <div className="grid grid-cols-1 gap-6 @md:grid-cols-3">
        {articles.map((article) => (
          <ImageNewsCard key={article.id || articleHref(article)} article={article} />
        ))}
      </div>
    </ListingShell>
  );
};
