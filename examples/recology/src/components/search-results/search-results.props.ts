import type { Field } from '@sitecore-content-sdk/nextjs';
import type { CompatibleDatasource, CompatibleField, ComponentProps } from '@/lib/component-props';

export interface SearchResultsFields {
  Title?: CompatibleField<Field<string>>;
  Subtitle?: CompatibleField<Field<string>>;
  Prompt?: CompatibleField<Field<string>>;
  Placeholder?: CompatibleField<Field<string>>;
}

export type SearchResultsProps = ComponentProps & {
  params?: { [key: string]: string };
  fields: CompatibleDatasource<SearchResultsFields>;
};
