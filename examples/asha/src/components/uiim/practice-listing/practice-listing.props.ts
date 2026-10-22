import type { Field } from '@sitecore-content-sdk/nextjs';
import type { ComponentProps } from '@/lib/component-props';

export type PracticeListingFields = {
  Title?: Field<string>;
  Intro?: Field<string>;
};

export type PracticeListingProps = ComponentProps & {
  fields?: PracticeListingFields;
};

export type PracticeListingVariant = 'list' | 'cards';

export type PracticeTopic = {
  id: string;
  title: string;
  href: string;
  summary: string;
  access: string[];
};
