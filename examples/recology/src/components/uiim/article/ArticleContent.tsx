import type { JSX } from 'react';
import type { Field, ImageField, RichTextField } from '@sitecore-content-sdk/nextjs';
import {
  Image as ContentSdkImage,
  RichText as ContentSdkRichText,
  Text,
} from '@sitecore-content-sdk/nextjs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ArticleEngagement } from './ArticleEngagement.client';
import type {
  ArticleContentProps,
  ArticleContentRouteFields,
} from './article-content.props';

const hasText = (field?: Field<string>): boolean => Boolean(field?.value?.toString().trim());
const hasRichText = (field?: RichTextField): boolean => Boolean(field?.value?.toString().trim());
const hasImageSrc = (field?: ImageField): boolean => Boolean(field?.value?.src);
const isChecked = (value?: string): boolean => value === '1' || value?.toLowerCase() === 'true';

const ArticleContentEmpty = (): JSX.Element => (
  <div className="component article-content">
    <div className="component-content">
      <span className="is-empty-hint">
        Article Content has no page fields to display. Add Header Title, Summary, or Content on the
        article page.
      </span>
    </div>
  </div>
);

const proseClasses = cn(
  'article-content-body text-base leading-relaxed @md:text-lg',
  '[&_h3]:font-heading [&_h3]:text-foreground [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-2xl [&_h3]:font-normal',
  '[&_h4]:font-heading [&_h4]:text-foreground [&_h4]:mt-7 [&_h4]:mb-2 [&_h4]:text-xl [&_h4]:font-semibold',
  '[&_p]:text-foreground [&_p]:mb-4',
  '[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6',
  '[&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6',
  '[&_li]:mb-2',
  '[&_strong]:font-semibold',
  '[&_a]:text-primary [&_a]:underline'
);

type ArticleViewOptions = {
  showImage: boolean;
};

const ArticleView = ({
  params,
  page,
  showImage,
}: ArticleContentProps & ArticleViewOptions): JSX.Element => {
  const { styles, RenderingIdentifier, LikesAndShares } = params || {};
  const isEditing = Boolean(page?.mode?.isEditing);
  const fields = (page?.layout?.sitecore?.route?.fields || {}) as ArticleContentRouteFields;
  const {
    Content,
    image,
    pageThumbnail,
    pageHeaderTitle,
    pageShortTitle,
    pageSubtitle,
    pageSummary,
    pageTitle,
    pageDisplayDate,
    pageReadTime,
  } = fields;

  const imageField = hasImageSrc(image) ? image : pageThumbnail;
  const headingField = hasText(pageHeaderTitle) || isEditing ? pageHeaderTitle : pageTitle;
  const hasHeading = hasText(headingField);
  const showShortTitle = hasText(pageShortTitle);
  const showSubtitle = hasText(pageSubtitle);
  const showSummary = hasText(pageSummary);
  const showContent = hasRichText(Content) || isEditing;
  const showDate = hasText(pageDisplayDate);
  const showReadTime = hasText(pageReadTime);
  const showMeta = showDate || showReadTime;
  const showHeroImage = showImage && (hasImageSrc(imageField) || isEditing);
  const showEngagement = isChecked(LikesAndShares);
  const titleText =
    headingField?.value?.toString().trim() || pageTitle?.value?.toString().trim() || '';

  if (
    !hasHeading &&
    !showShortTitle &&
    !showSubtitle &&
    !showSummary &&
    !showContent &&
    !showMeta &&
    !showHeroImage
  ) {
    return <ArticleContentEmpty />;
  }

  return (
    <article
      className={cn('component article-content @container', styles)}
      id={RenderingIdentifier || undefined}
      data-testid="article-content"
      data-variant={showImage ? 'default' : 'no-image'}
    >
      <div className="component-content mx-auto max-w-3xl px-4 py-10 @md:px-6 @md:py-14">
        {showShortTitle ? (
          <Badge
            variant="secondary"
            className="font-body mb-4 text-xs font-medium tracking-wide uppercase"
          >
            <Text field={pageShortTitle} />
          </Badge>
        ) : null}

        {(hasHeading || isEditing) && (
          <Text
            tag="h1"
            field={headingField}
            className="font-heading text-foreground text-pretty text-3xl font-semibold tracking-tight @md:text-5xl"
          />
        )}

        {showSubtitle ? (
          <Text
            tag="p"
            field={pageSubtitle}
            className="text-muted-foreground mt-3 text-lg tracking-tight @md:text-xl"
          />
        ) : null}

        {showSummary ? (
          <Text
            tag="p"
            field={pageSummary}
            className="text-foreground mt-5 text-pretty text-lg font-medium leading-relaxed tracking-tight @md:text-xl"
          />
        ) : null}

        {showMeta ? (
          <div className="text-muted-foreground mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            {showDate ? (
              <time dateTime={pageDisplayDate?.value || undefined}>
                <Text field={pageDisplayDate} />
              </time>
            ) : null}
            {showDate && showReadTime ? <span aria-hidden="true">·</span> : null}
            {showReadTime ? <Text field={pageReadTime} /> : null}
          </div>
        ) : null}

        {showHeroImage ? (
          <figure
            className="mt-8 overflow-hidden rounded-default bg-muted"
            data-testid="article-content-image"
          >
            <ContentSdkImage
              field={imageField}
              className="aspect-[16/9] h-auto w-full object-cover"
            />
          </figure>
        ) : null}

        {showContent ? (
          <div
            className={cn(
              proseClasses,
              showHeroImage || showMeta || showSummary ? 'mt-8' : 'mt-6'
            )}
          >
            <ContentSdkRichText field={Content} />
          </div>
        ) : null}

        {showEngagement ? (
          <ArticleEngagement className="mt-10" title={titleText} />
        ) : null}
      </div>
    </article>
  );
};

/** Default — feature image from the page `image` / `pageThumbnail` field under the intro. */
export const Default = (props: ArticleContentProps): JSX.Element => (
  <ArticleView {...props} showImage />
);

/** NoImage — same article chrome without the feature image. */
export const NoImage = (props: ArticleContentProps): JSX.Element => (
  <ArticleView {...props} showImage={false} />
);
