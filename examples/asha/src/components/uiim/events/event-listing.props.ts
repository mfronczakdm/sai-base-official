import type { Field, LinkField } from '@sitecore-content-sdk/nextjs';
import type { ComponentProps, GraphQLField } from '@/lib/component-props';

export type EventDateField = {
  value?: string;
  jsonValue?: { value?: string };
};

export type EventListingItem = {
  id?: string;
  name?: string;
  url?: { path?: string };
  title?: GraphQLField<Field<string>>;
  eventName?: GraphQLField<Field<string>>;
  eventPlace?: GraphQLField<Field<string>>;
  eventStart?: EventDateField;
  eventEnd?: EventDateField;
  eventLink?: GraphQLField<LinkField>;
  children?: {
    results?: EventListingItem[];
  };
};

export type EventListingDatasource = {
  id?: string;
  name?: string;
  title?: GraphQLField<Field<string>>;
  events?: {
    targetItems?: EventListingItem[];
  };
};

export type EventListingFields = {
  data?: {
    datasource?: EventListingDatasource;
  };
};

export type EventListingProps = ComponentProps & {
  fields?: EventListingFields;
};
