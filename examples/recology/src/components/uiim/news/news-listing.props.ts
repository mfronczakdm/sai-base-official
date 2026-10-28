import type { Field, LinkField } from '@sitecore-content-sdk/nextjs';
import type { ComponentProps, GraphQLField } from '@/lib/component-props';
import type { SitecoreImageGraphField } from '@/lib/sitecore-image-field';

export type NewsListingArticle = {
  id?: string;
  name?: string;
  url?: { path?: string };
  pageTitle?: GraphQLField<Field<string>>;
  pageHeaderTitle?: GraphQLField<Field<string>>;
  pageSummary?: GraphQLField<Field<string>>;
  /** Prefer Page `image`; DAM XML arrives as `{ value: "<Image src=.../>" }` from ComponentQuery. */
  pageThumbnail?: SitecoreImageGraphField;
  image?: SitecoreImageGraphField;
  sourceLink?: GraphQLField<LinkField>;
  titleAccent?: GraphQLField<Field<boolean | string>>;
};

export type NewsListingDatasource = NewsListingArticle & {
  title?: GraphQLField<Field<string>>;
  link?: GraphQLField<LinkField>;
  articles?: {
    targetItems?: NewsListingArticle[];
  };
  children?: {
    results?: NewsListingArticle[];
  };
};

export type NewsListingFields = {
  data?: {
    datasource?: NewsListingDatasource;
  };
};

export type NewsListingProps = ComponentProps & {
  fields?: NewsListingFields;
};
