import type { Field, ImageField, LinkField } from '@sitecore-content-sdk/nextjs';
import type { ComponentProps, GraphQLField } from '@/lib/component-props';
import type { EventDateField } from './event-listing.props';

export type EventBannerImage = GraphQLField<ImageField> | { value?: string | ImageField['value'] };

export type EventBannerEvent = {
  id?: string;
  name?: string;
  eventName?: GraphQLField<Field<string>>;
  eventPlace?: GraphQLField<Field<string>>;
  eventDescription?: GraphQLField<Field<string>>;
  eventStart?: EventDateField;
  eventEnd?: EventDateField;
  eventLink?: GraphQLField<LinkField>;
  eventImage?: EventBannerImage;
};

export type EventBannerFields = {
  data?: {
    datasource?: EventBannerEvent;
  };
};

export type EventBannerProps = ComponentProps & {
  fields?: EventBannerFields;
  imageSide?: 'left' | 'right';
};
