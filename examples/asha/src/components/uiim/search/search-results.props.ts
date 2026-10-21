import type { Field } from '@sitecore-content-sdk/nextjs';
import type { ComponentProps } from '@/lib/component-props';

export type SearchResultsFields = {
  Title?: Field<string>;
  Subtitle?: Field<string>;
  Prompt?: Field<string>;
  Placeholder?: Field<string>;
};

export type SearchResultsProps = ComponentProps & {
  fields?: SearchResultsFields;
};
