import type { Field, ImageField, LinkField } from '@sitecore-content-sdk/nextjs';
import type { ComponentProps, CompatibleDatasource, GraphQLField } from '@/lib/component-props';

export type YourCartTextField = GraphQLField<Field<string>>;
export type YourCartImageField = GraphQLField<ImageField>;
export type YourCartLinkField = GraphQLField<LinkField>;

export type YourCartTypeItem = {
  id?: string;
  name?: string;
  displayName?: string;
  cartName?: YourCartTextField;
  description?: YourCartTextField;
  color?: YourCartTextField;
  stream?: YourCartTextField;
  image?: YourCartImageField;
};

export type YourCartSizeItem = {
  id?: string;
  name?: string;
  displayName?: string;
  sizeName?: YourCartTextField;
  capacity?: YourCartTextField;
  unit?: YourCartTextField;
  dimensions?: YourCartTextField;
  description?: YourCartTextField;
};

export type YourCartLocationItem = {
  id?: string;
  name?: string;
  displayName?: string;
  locationName?: YourCartTextField;
  cartTypes?: {
    targetItems?: YourCartTypeItem[];
  };
  cartSizes?: {
    targetItems?: YourCartSizeItem[];
  };
  modifyServiceLink?: YourCartLinkField;
  newCustomersLink?: YourCartLinkField;
  parent?: YourCartLocationItem;
};

export type YourCartFields = CompatibleDatasource<YourCartLocationItem> & {
  data?: {
    contextItem?: YourCartLocationItem;
    datasource?: YourCartLocationItem;
  };
};

export type YourCartProps = ComponentProps & {
  fields?: YourCartFields;
};
