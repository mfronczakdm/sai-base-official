import type { Field, LinkField, RichTextField } from '@sitecore-content-sdk/nextjs';
import type { CompatibleDatasource, ComponentProps, GraphQLField } from '@/lib/component-props';

export type RegionalFaqBehavior =
  | 'UseGlobal'
  | 'AddRegionalInformation'
  | 'Override'
  | 'Exclude';

export type RegionalFaqTextField = GraphQLField<Field<string>>;
export type RegionalFaqRichTextField = GraphQLField<RichTextField>;
export type RegionalFaqLinkField = GraphQLField<LinkField>;
export type RegionalFaqCheckboxField = GraphQLField<Field<boolean | string>>;

export type GlobalFaqItem = {
  id?: string;
  name?: string;
  question?: RegionalFaqTextField;
  answer?: RegionalFaqRichTextField;
  category?: RegionalFaqTextField & {
    targetItem?: { name?: string; displayName?: string };
  };
  keywords?: RegionalFaqTextField;
  audience?: RegionalFaqTextField;
  serviceType?: RegionalFaqTextField;
  materialType?: RegionalFaqTextField;
  sortOrder?: RegionalFaqTextField | GraphQLField<Field<string | number>>;
  active?: RegionalFaqCheckboxField;
};

export type RegionalFaqConfigurationItem = {
  id?: string;
  name?: string;
  globalFaq?: {
    targetItem?: GlobalFaqItem;
    targetItems?: GlobalFaqItem[];
    jsonValue?: Field<string> | { value?: string };
  };
  behavior?: RegionalFaqTextField & {
    targetItem?: {
      name?: string;
      displayName?: string;
      key?: RegionalFaqTextField;
    };
  };
  behaviorKey?: RegionalFaqTextField;
  regionalSupportingInformation?: RegionalFaqRichTextField;
  regionalAnswer?: RegionalFaqRichTextField;
  contactCta?: RegionalFaqLinkField;
  effectiveDate?: RegionalFaqTextField;
  expirationDate?: RegionalFaqTextField;
  sortOrder?: RegionalFaqTextField | GraphQLField<Field<string | number>>;
  active?: RegionalFaqCheckboxField;
};

export type RegionalFaqCollectionDatasource = {
  id?: string;
  name?: string;
  heading?: RegionalFaqTextField;
  introductoryText?: RegionalFaqRichTextField;
  title?: RegionalFaqTextField;
  region?: {
    targetItem?: { id?: string; name?: string; displayName?: string };
    jsonValue?: Field<string> | { value?: string };
  };
  expandFirstItem?: RegionalFaqCheckboxField;
  allowMultipleOpenItems?: RegionalFaqCheckboxField;
  showCategories?: RegionalFaqCheckboxField;
  emptyStateMessage?: RegionalFaqTextField;
  faqConfigurations?: {
    targetItems?: RegionalFaqConfigurationItem[];
  };
  children?: {
    results?: RegionalFaqConfigurationItem[];
  };
};

export type RegionalFaqFields = CompatibleDatasource<RegionalFaqCollectionDatasource> & {
  data?: {
    datasource?: RegionalFaqCollectionDatasource;
  };
};

export type RegionalFaqProps = ComponentProps & {
  fields?: RegionalFaqFields;
};

export type ResolvedRegionalFaq = {
  id: string;
  question: Field<string>;
  globalAnswer?: RichTextField;
  regionalSupportingInformation?: RichTextField;
  resolvedAnswer?: RichTextField;
  behavior: Exclude<RegionalFaqBehavior, 'Exclude'>;
  category?: string;
  sortOrder: number;
  contactCta?: LinkField;
};
