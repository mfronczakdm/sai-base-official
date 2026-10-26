import type { Field, RichTextField } from '@sitecore-content-sdk/nextjs';
import type { ComponentProps, CompatibleDatasource, GraphQLField } from '@/lib/component-props';

export type RatesCartsDetailTextField = GraphQLField<Field<string>>;
export type RatesCartsDetailRichTextField = GraphQLField<RichTextField>;

export type RatesCartSizeItem = {
  id?: string;
  name?: string;
  displayName?: string;
  cartName?: RatesCartsDetailTextField;
  dimensions?: RatesCartsDetailTextField;
  description?: RatesCartsDetailTextField;
  capacity?: RatesCartsDetailTextField;
};

export type RatesCartRateItem = {
  id?: string;
  name?: string;
  displayName?: string;
  template?: { id?: string; name?: string };
  monthlyRate?: RatesCartsDetailTextField;
  dimensions?: RatesCartsDetailTextField;
  typicalWeeklyNeeds?: RatesCartsDetailTextField;
  cartSize?: {
    jsonValue?: Field<string> | { value?: string };
    targetItem?: RatesCartSizeItem;
  };
};

export type RatesAdditionalServiceItem = {
  id?: string;
  name?: string;
  displayName?: string;
  template?: { id?: string; name?: string };
  serviceName?: RatesCartsDetailTextField;
  cost?: RatesCartsDetailTextField;
  isSectionHeader?: RatesCartsDetailTextField | GraphQLField<Field<boolean>>;
};

export type RatesLocationChildFolder = {
  id?: string;
  name?: string;
  displayName?: string;
  template?: { id?: string; name?: string };
  children?: {
    results?: Array<RatesCartRateItem | RatesAdditionalServiceItem>;
  };
};

export type RatesLocationItem = {
  id?: string;
  name?: string;
  template?: { name?: string };
  ratesHeading?: RatesCartsDetailTextField;
  ratesIntro?: RatesCartsDetailRichTextField;
  importantNotes?: RatesCartsDetailRichTextField;
  careProgramHeading?: RatesCartsDetailTextField;
  careProgramContent?: RatesCartsDetailRichTextField;
  cartRates?: {
    targetItems?: RatesCartRateItem[];
  };
  additionalServices?: {
    targetItems?: RatesAdditionalServiceItem[];
  };
  children?: {
    results?: RatesLocationChildFolder[];
  };
  parent?: RatesLocationItem;
};

export type RatesCartsDetailContextItem = RatesLocationItem & {
  parent?: RatesLocationItem;
};

export type RatesCartsDetailFields = CompatibleDatasource<RatesCartsDetailContextItem> & {
  data?: {
    contextItem?: RatesCartsDetailContextItem;
    datasource?: RatesCartsDetailContextItem;
  };
};

export type RatesCartsDetailProps = ComponentProps & {
  fields?: RatesCartsDetailFields;
};
