import type { Field, ImageField, RichTextField } from '@sitecore-content-sdk/nextjs';
import type { ComponentProps } from '@/lib/component-props';

export type ArticleContentRouteFields = {
  Content?: RichTextField;
  image?: ImageField;
  pageThumbnail?: ImageField;
  pageHeaderTitle?: Field<string>;
  pageShortTitle?: Field<string>;
  pageSubtitle?: Field<string>;
  pageSummary?: Field<string>;
  pageTitle?: Field<string>;
  pageDisplayDate?: Field<string>;
  pageReadTime?: Field<string>;
};

export type ArticleContentParams = {
  styles?: string;
  RenderingIdentifier?: string;
  /** Advanced styling checkbox — "1" when enabled */
  LikesAndShares?: string;
  ShowContent?: string;
  [key: string]: string | undefined;
};

export type ArticleContentProps = ComponentProps & {
  params?: ArticleContentParams;
};
