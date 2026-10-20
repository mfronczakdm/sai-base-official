import type { Field, ImageField, LinkField } from '@sitecore-content-sdk/nextjs';
import type { CompatibleField, ComponentProps, GraphQLField } from '@/lib/component-props';
import type { EventDateField } from './event-listing.props';

export type EventBannerImage = GraphQLField<ImageField> | { value?: string | ImageField['value'] };

export type EventBannerEvent = {
  id?: string;
  name?: string;
  eventName?: CompatibleField<Field<string>>;
  eventPlace?: CompatibleField<Field<string>>;
  eventDescription?: CompatibleField<Field<string>>;
  eventStart?: EventDateField;
  eventEnd?: EventDateField;
  eventLink?: CompatibleField<LinkField>;
  eventImage?: EventBannerImage;
};

export type EventBannerFields = {
  data?: {
    datasource?: EventBannerEvent;
  };
  EventName?: CompatibleField<Field<string>>;
  EventPlace?: CompatibleField<Field<string>>;
  EventDescription?: CompatibleField<Field<string>>;
  EventStart?: EventDateField;
  EventEnd?: EventDateField;
  EventLink?: CompatibleField<LinkField>;
  eventImage?: EventBannerImage;
};

export type EventBannerProps = ComponentProps & {
  fields?: EventBannerFields;
  imageSide?: 'left' | 'right';
};
