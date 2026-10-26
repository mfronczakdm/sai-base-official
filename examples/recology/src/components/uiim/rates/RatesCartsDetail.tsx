import type { JSX } from 'react';
import type { Field, RichTextField } from '@sitecore-content-sdk/nextjs';
import { RichText, Text } from '@sitecore-content-sdk/nextjs';
import { getDatasource, getFieldValue } from '@/lib/component-props';
import { cn } from '@/lib/utils';
import { NoDataFallback } from '@/utils/NoDataFallback';
import type {
  RatesAdditionalServiceItem,
  RatesCartRateItem,
  RatesCartsDetailProps,
  RatesLocationChildFolder,
  RatesLocationItem,
} from './rates-carts-detail.props';

const LOCATION_TEMPLATE = 'LocationItem';
const CART_RATE_TEMPLATE = 'LocationCartRate';
const ADDITIONAL_SERVICE_TEMPLATE = 'LocationAdditionalService';

const fieldText = (field?: { jsonValue?: Field<string>; value?: string }): string => {
  const value = getFieldValue(field)?.value ?? field?.value;
  return typeof value === 'string' ? value.trim() : '';
};

const hasRichText = (field?: { jsonValue?: RichTextField }): boolean =>
  Boolean(getFieldValue(field)?.value?.toString().trim());

const isChecked = (field?: { jsonValue?: Field<boolean | string> }): boolean => {
  const value = getFieldValue(field)?.value;
  return value === true || value === '1' || value === 'true';
};

const isLocationTemplate = (item?: RatesLocationItem | null): boolean =>
  item?.template?.name === LOCATION_TEMPLATE;

const hasRatesFields = (item?: RatesLocationItem | null): boolean =>
  Boolean(
    fieldText(item?.ratesHeading) ||
      hasRichText(item?.ratesIntro) ||
      hasRichText(item?.importantNotes) ||
      fieldText(item?.careProgramHeading) ||
      hasRichText(item?.careProgramContent) ||
      (item?.cartRates?.targetItems?.length ?? 0) > 0 ||
      (item?.additionalServices?.targetItems?.length ?? 0) > 0 ||
      item?.children?.results?.some(
        (child) =>
          child.name?.toLowerCase() === 'cart rates' ||
          child.name?.toLowerCase() === 'additional services'
      )
  );

const resolveLocation = (contextItem?: RatesLocationItem | null): RatesLocationItem | undefined => {
  if (!contextItem) return undefined;
  if (isLocationTemplate(contextItem) || hasRatesFields(contextItem)) return contextItem;
  if (isLocationTemplate(contextItem.parent) || hasRatesFields(contextItem.parent)) {
    return contextItem.parent;
  }
  return contextItem.parent || contextItem;
};

const folderByName = (
  location: RatesLocationItem | undefined,
  folderName: string
): RatesLocationChildFolder | undefined =>
  location?.children?.results?.find(
    (child) => child.name?.toLowerCase() === folderName.toLowerCase()
  );

const cartRates = (location?: RatesLocationItem): RatesCartRateItem[] => {
  const fromMultilist = location?.cartRates?.targetItems?.filter((rate) =>
    Boolean(fieldText(rate.monthlyRate) || rate.name)
  );
  if (fromMultilist?.length) return fromMultilist;

  const folder = folderByName(location, 'Cart Rates');
  return (
    folder?.children?.results?.filter((item): item is RatesCartRateItem => {
      const rate = item as RatesCartRateItem;
      return rate.template?.name === CART_RATE_TEMPLATE || Boolean(fieldText(rate.monthlyRate));
    }) ?? []
  );
};

const additionalServices = (location?: RatesLocationItem): RatesAdditionalServiceItem[] => {
  const fromMultilist = location?.additionalServices?.targetItems?.filter((service) =>
    Boolean(fieldText(service.serviceName) || service.name)
  );
  if (fromMultilist?.length) return fromMultilist;

  const folder = folderByName(location, 'Additional Services');
  return (
    folder?.children?.results?.filter((item): item is RatesAdditionalServiceItem => {
      const service = item as RatesAdditionalServiceItem;
      return (
        service.template?.name === ADDITIONAL_SERVICE_TEMPLATE ||
        Boolean(fieldText(service.serviceName))
      );
    }) ?? []
  );
};

const cartSizeLabel = (rate: RatesCartRateItem): string =>
  rate.displayName?.trim() || rate.name?.trim() || fieldText(rate.cartSize?.targetItem?.cartName);

const cartNeeds = (rate: RatesCartRateItem): string =>
  fieldText(rate.typicalWeeklyNeeds) || fieldText(rate.cartSize?.targetItem?.description);

const cartDimensions = (rate: RatesCartRateItem): string =>
  fieldText(rate.dimensions) || fieldText(rate.cartSize?.targetItem?.dimensions);

const RatesCartsDetailEmpty = (): JSX.Element => (
  <div className="component rates-carts-detail">
    <div className="component-content">
      <span className="is-empty-hint">
        Rates &amp; Carts Detail needs a parent LocationItem with Rates fields and Cart Rates
        children.
      </span>
    </div>
  </div>
);

export const Default = (props: RatesCartsDetailProps): JSX.Element => {
  const { fields, params, page } = props;
  const { styles, RenderingIdentifier } = params || {};
  const isEditing = Boolean(page?.mode?.isEditing);

  const contextItem =
    getDatasource(fields) || fields?.data?.datasource || fields?.data?.contextItem;
  const location = resolveLocation(contextItem);
  const rates = cartRates(location);
  const services = additionalServices(location);

  const headingField = getFieldValue(location?.ratesHeading);
  const introField = getFieldValue(location?.ratesIntro);
  const notesField = getFieldValue(location?.importantNotes);
  const careHeadingField = getFieldValue(location?.careProgramHeading);
  const careContentField = getFieldValue(location?.careProgramContent);

  const hasHeading = Boolean(headingField?.value?.toString().trim()) || isEditing;
  const hasIntro = hasRichText(location?.ratesIntro) || isEditing;
  const hasNotes = hasRichText(location?.importantNotes) || isEditing;
  const hasCareHeading = Boolean(careHeadingField?.value?.toString().trim()) || isEditing;
  const hasCareContent = hasRichText(location?.careProgramContent) || isEditing;
  const hasRates = rates.length > 0;
  const hasServices = services.length > 0;

  if (!location) {
    return isEditing ? <RatesCartsDetailEmpty /> : <NoDataFallback componentName="RatesCartsDetail" />;
  }

  if (
    !hasHeading &&
    !hasIntro &&
    !hasNotes &&
    !hasCareHeading &&
    !hasCareContent &&
    !hasRates &&
    !hasServices
  ) {
    return isEditing ? <RatesCartsDetailEmpty /> : <NoDataFallback componentName="RatesCartsDetail" />;
  }

  return (
    <section
      className={cn('component rates-carts-detail @container bg-background text-foreground', styles)}
      id={RenderingIdentifier || undefined}
      data-testid="rates-carts-detail"
    >
      <div className="component-content mx-auto max-w-5xl px-4 py-10 @md:py-14">
        {hasHeading && (
          <Text
            tag="h2"
            field={headingField}
            className="font-heading text-3xl font-semibold tracking-tight text-foreground @md:text-4xl"
          />
        )}

        {hasIntro && (
          <RichText
            field={introField}
            className="mt-4 max-w-3xl text-base leading-relaxed text-foreground/90 [&_p]:mb-3"
          />
        )}

        {hasNotes && (
          <div data-testid="rates-important-notes">
            <RichText
              field={notesField}
              className="mt-6 border-l-4 border-secondary pl-4 text-sm leading-relaxed text-foreground/80 [&_p]:mb-2 [&_strong]:font-semibold"
            />
          </div>
        )}

        {hasRates && (
          <div className="mt-10 overflow-x-auto" data-testid="rates-cart-table">
            <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-3 py-3 font-heading text-xs font-semibold uppercase tracking-wide">
                    Cart Size
                  </th>
                  <th className="px-3 py-3 font-heading text-xs font-semibold uppercase tracking-wide">
                    Monthly Rates
                  </th>
                  <th className="px-3 py-3 font-heading text-xs font-semibold uppercase tracking-wide">
                    Typical Weekly Garbage Needs for Households
                  </th>
                  <th className="px-3 py-3 font-heading text-xs font-semibold uppercase tracking-wide">
                    Dimensions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rates.map((rate) => {
                  const monthly = getFieldValue(rate.monthlyRate);
                  return (
                    <tr
                      key={rate.id || rate.name}
                      className="border-b border-border/80 align-top"
                      data-testid="rates-cart-row"
                    >
                      <td className="px-3 py-3 font-medium text-foreground">
                        {cartSizeLabel(rate)}
                      </td>
                      <td className="px-3 py-3 tabular-nums">
                        {monthly ? <Text field={monthly} /> : null}
                      </td>
                      <td className="px-3 py-3 text-foreground/85">{cartNeeds(rate)}</td>
                      <td className="px-3 py-3 text-foreground/85">{cartDimensions(rate)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {hasServices && (
          <div className="mt-10 overflow-x-auto" data-testid="rates-services-table">
            <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-3 py-3 font-heading text-xs font-semibold uppercase tracking-wide">
                    Additional Services
                  </th>
                  <th className="px-3 py-3 font-heading text-xs font-semibold uppercase tracking-wide">
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => {
                  const nameField = getFieldValue(service.serviceName);
                  const costField = getFieldValue(service.cost);
                  const sectionHeader = isChecked(service.isSectionHeader);
                  const label =
                    fieldText(service.serviceName) ||
                    service.displayName ||
                    service.name ||
                    '';

                  if (sectionHeader) {
                    return (
                      <tr
                        key={service.id || service.name}
                        className="border-b border-border/80 bg-muted/20"
                        data-testid="rates-service-section"
                      >
                        <td
                          colSpan={2}
                          className="px-3 py-3 font-heading text-sm font-semibold text-foreground"
                        >
                          {nameField ? <Text field={nameField} /> : label}
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={service.id || service.name}
                      className="border-b border-border/80"
                      data-testid="rates-service-row"
                    >
                      <td className="px-3 py-3 text-foreground/90">
                        {nameField ? <Text field={nameField} /> : label}
                      </td>
                      <td className="px-3 py-3 tabular-nums">
                        {costField ? <Text field={costField} /> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {(hasCareHeading || hasCareContent) && (
          <div className="mt-12 max-w-3xl" data-testid="rates-care-program">
            {hasCareHeading && (
              <Text
                tag="h3"
                field={careHeadingField}
                className="font-heading text-2xl font-semibold text-foreground"
              />
            )}
            {hasCareContent && (
              <RichText
                field={careContentField}
                className="mt-4 text-base leading-relaxed text-foreground/90 [&_a]:text-primary [&_a]:underline [&_p]:mb-3"
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
};
