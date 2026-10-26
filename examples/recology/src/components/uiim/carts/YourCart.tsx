import type { JSX } from 'react';
import type { Field, ImageField, LinkField } from '@sitecore-content-sdk/nextjs';
import {
  Link as ContentSdkLink,
  NextImage as ContentSdkImage,
  Text,
} from '@sitecore-content-sdk/nextjs';
import { getDatasource, getFieldValue } from '@/lib/component-props';
import { cn } from '@/lib/utils';
import { NoDataFallback } from '@/utils/NoDataFallback';
import { Button } from '@/components/ui/button';
import type {
  YourCartLocationItem,
  YourCartProps,
  YourCartSizeItem,
  YourCartTypeItem,
} from './your-cart.props';

const LOCATION_TEMPLATE = 'LocationItem';

type CartLayout = 'columns' | 'rows';

const FALLBACK_IMAGES: Record<string, { src: string; alt: string }> = {
  green: {
    src: '/carts/food-yard-waste.png',
    alt: 'Green food and yard waste cart',
  },
  blue: {
    src: '/carts/recycling.jpg',
    alt: 'Blue recycling cart',
  },
  black: {
    src: '/carts/garbage.jpg',
    alt: 'Black or gray landfill cart',
  },
  gray: {
    src: '/carts/garbage.jpg',
    alt: 'Black or gray landfill cart',
  },
};

const fieldText = (field?: { jsonValue?: Field<string>; value?: string }): string => {
  const value = getFieldValue(field)?.value ?? field?.value;
  return typeof value === 'string' ? value.trim() : '';
};

const hasLink = (field?: { jsonValue?: LinkField }): boolean => {
  const value = getFieldValue(field)?.value;
  return Boolean(value?.href || value?.url || value?.text);
};

const resolveLocation = (item?: YourCartLocationItem | null): YourCartLocationItem | undefined => {
  if (!item) return undefined;
  if (item.cartTypes?.targetItems?.length || item.cartSizes?.targetItems?.length) return item;
  if (item.parent?.cartTypes?.targetItems?.length || item.parent?.cartSizes?.targetItems?.length) {
    return item.parent;
  }
  if ((item as { template?: { name?: string } }).template?.name === LOCATION_TEMPLATE) return item;
  return item.parent || item;
};

const colorKey = (cart: YourCartTypeItem): string => {
  const color = fieldText(cart.color).toLowerCase();
  const name = `${fieldText(cart.cartName) || cart.displayName || cart.name || ''}`.toLowerCase();
  if (color.includes('green') || name.includes('green')) return 'green';
  if (color.includes('blue') || name.includes('blue')) return 'blue';
  if (
    color.includes('black') ||
    color.includes('gray') ||
    name.includes('black') ||
    name.includes('gray')
  ) {
    return 'black';
  }
  return 'green';
};

const accentBarClass = (key: string): string => {
  if (key === 'blue') return 'bg-[#0693E3]';
  if (key === 'black' || key === 'gray') return 'bg-[#444444]';
  return 'bg-[#27A746]';
};

const YourCartEmpty = (): JSX.Element => (
  <div className="component your-cart">
    <div className="component-content">
      <span className="is-empty-hint">
        Your Cart needs a LocationItem datasource with Cart Types and Cart Sizes selected.
      </span>
    </div>
  </div>
);

const isUsableCartImage = (field?: ImageField): boolean => {
  const value = field?.value;
  if (!value?.src) return false;
  const width = Number(value.width) || 0;
  // Ignore tiny DAM icon assets (e.g. 81x125) - prefer full cart posters
  if (width > 0 && width < 200) return false;
  return true;
};

const CartImage = ({
  cart,
  layout,
}: {
  cart: YourCartTypeItem;
  layout: CartLayout;
}): JSX.Element => {
  const key = colorKey(cart);
  const fallback = FALLBACK_IMAGES[key] || FALLBACK_IMAGES.green;
  const imageField = getFieldValue(cart.image) as ImageField | undefined;
  const useSitecoreImage = isUsableCartImage(imageField);
  const posterSrc = imageField?.value?.src?.startsWith('/carts/')
    ? imageField.value.src
    : fallback.src;
  const posterAlt =
    (typeof imageField?.value?.alt === 'string' && imageField.value.alt) || fallback.alt;

  const imageClass =
    layout === 'rows'
      ? 'mx-auto h-36 w-auto max-w-full object-contain object-center transition duration-300 group-hover:scale-[1.02] @md:h-44'
      : 'mx-auto h-44 w-auto max-w-full object-contain object-center transition duration-300 group-hover:scale-[1.02] @md:h-52';

  if (useSitecoreImage && !imageField?.value?.src?.startsWith('/carts/')) {
    return <ContentSdkImage field={imageField} className={imageClass} />;
  }

  return (
    // Full Recology cart posters (public/carts) - height-capped to fit the viewport
    // eslint-disable-next-line @next/next/no-img-element
    <img src={posterSrc} alt={posterAlt} className={imageClass} />
  );
};

const CartTypeCard = ({
  cart,
  layout,
}: {
  cart: YourCartTypeItem;
  layout: CartLayout;
}): JSX.Element => {
  const key = colorKey(cart);
  const nameField = getFieldValue(cart.cartName) || {
    value: cart.displayName || cart.name || 'Cart',
  };
  const stream = fieldText(cart.stream);
  const description = fieldText(cart.description);
  const isRows = layout === 'rows';

  return (
    <article
      className={cn(
        'group overflow-hidden rounded-2xl border border-border/70 bg-white shadow-sm',
        'transition duration-300 hover:-translate-y-0.5 hover:shadow-md',
        isRows
          ? 'flex flex-col @sm:flex-row @sm:items-stretch'
          : 'flex flex-col'
      )}
      data-testid="your-cart-type"
      data-cart-color={key}
      data-layout={layout}
    >
      {isRows ? (
        <div className={cn('w-full shrink-0 @sm:w-1.5', accentBarClass(key), 'hidden @sm:block')} />
      ) : (
        <div className={cn('h-1.5 w-full', accentBarClass(key))} />
      )}
      <div
        className={cn(
          'flex items-center justify-center bg-muted/25',
          isRows
            ? 'px-4 py-4 @sm:w-44 @md:w-52'
            : 'px-4 py-5'
        )}
      >
        <CartImage cart={cart} layout={layout} />
      </div>
      <div
        className={cn(
          'flex flex-1 flex-col gap-2',
          isRows ? 'justify-center p-5 @sm:py-6' : 'p-5'
        )}
      >
        {stream && (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {stream}
          </p>
        )}
        <Text
          tag="h3"
          field={nameField}
          className="font-heading text-xl font-semibold tracking-tight text-foreground"
        />
        {description && (
          <p className="text-sm leading-relaxed text-foreground/80">{description}</p>
        )}
      </div>
    </article>
  );
};

const SizeChip = ({ size }: { size: YourCartSizeItem }): JSX.Element => {
  const label =
    fieldText(size.sizeName) || size.displayName || size.name || fieldText(size.capacity) || 'Size';
  const capacity = fieldText(size.capacity);
  const unit = fieldText(size.unit);
  const dimensions = fieldText(size.dimensions);
  const detail = [capacity && unit ? `${capacity} ${unit}` : capacity || unit, dimensions]
    .filter(Boolean)
    .join(' | ');

  return (
    <li
      className="rounded-xl border border-border/80 bg-muted/30 px-4 py-3"
      data-testid="your-cart-size"
    >
      <p className="font-heading text-sm font-semibold text-foreground">{label}</p>
      {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
    </li>
  );
};

const YourCartView = ({
  props,
  layout,
}: {
  props: YourCartProps;
  layout: CartLayout;
}): JSX.Element => {
  const { fields, params, page } = props;
  const { styles, RenderingIdentifier } = params || {};
  const isEditing = Boolean(page?.mode?.isEditing);

  const contextItem =
    getDatasource(fields) || fields?.data?.datasource || fields?.data?.contextItem;
  const location = resolveLocation(contextItem);

  const cartTypes =
    location?.cartTypes?.targetItems?.filter((cart) =>
      Boolean(fieldText(cart.cartName) || cart.displayName || cart.name)
    ) ?? [];
  const cartSizes =
    location?.cartSizes?.targetItems?.filter((size) =>
      Boolean(fieldText(size.sizeName) || size.displayName || size.name)
    ) ?? [];

  const locationLabel =
    fieldText(location?.locationName) || location?.displayName || location?.name || 'your area';
  const modifyLink = getFieldValue(location?.modifyServiceLink) as LinkField | undefined;
  const newCustomerLink = getFieldValue(location?.newCustomersLink) as LinkField | undefined;
  const showModify = hasLink(location?.modifyServiceLink) || isEditing;
  const showNew = hasLink(location?.newCustomersLink) || isEditing;

  if (!location) {
    return isEditing ? <YourCartEmpty /> : <NoDataFallback componentName="YourCart" />;
  }

  if (!cartTypes.length && !cartSizes.length && !showModify && !showNew) {
    return isEditing ? <YourCartEmpty /> : <NoDataFallback componentName="YourCart" />;
  }

  return (
    <section
      className={cn('component your-cart @container bg-background text-foreground', styles)}
      id={RenderingIdentifier || undefined}
      data-testid="your-cart"
      data-variant={layout}
    >
      <div className="component-content mx-auto max-w-6xl px-4 py-10 @md:py-14">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            My Recology Service
          </p>
          <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-foreground @md:text-4xl">
            Your carts in {locationLabel}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-foreground/80">
            Sort smarter with the carts available in your service area. Each color stream keeps
            compost, recycling, and landfill material moving to the right place.
          </p>
        </div>

        {cartTypes.length > 0 && (
          <div
            className={cn(
              'mt-10 grid gap-5',
              layout === 'rows' && 'mx-auto max-w-3xl grid-cols-1',
              layout === 'columns' && cartTypes.length === 1 && 'mx-auto max-w-xs',
              layout === 'columns' && cartTypes.length === 2 && '@md:grid-cols-2',
              layout === 'columns' && cartTypes.length >= 3 && '@md:grid-cols-2 @lg:grid-cols-3'
            )}
          >
            {cartTypes.map((cart) => (
              <CartTypeCard key={cart.id || cart.name} cart={cart} layout={layout} />
            ))}
          </div>
        )}

        {cartSizes.length > 0 && (
          <div className="mt-12 rounded-2xl border border-border/70 bg-muted/20 p-6 @md:p-8">
            <h3 className="font-heading text-xl font-semibold tracking-tight">
              Available cart sizes
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-foreground/75">
              Choose the capacity that fits your household. Rates and pickup details are listed on
              your Residential Rates page.
            </p>
            <ul className="mt-6 grid gap-3 @sm:grid-cols-2 @lg:grid-cols-3">
              {cartSizes.map((size) => (
                <SizeChip key={size.id || size.name} size={size} />
              ))}
            </ul>
          </div>
        )}

        {(showModify || showNew) && (
          <div className="mt-10 flex flex-col items-center justify-center gap-3 @sm:flex-row">
            {showModify && (
              <Button
                asChild
                size="lg"
                className="min-w-[11rem] bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <ContentSdkLink
                  field={
                    modifyLink || {
                      value: { href: '#', text: 'Modify Service' },
                    }
                  }
                />
              </Button>
            )}
            {showNew && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="min-w-[11rem] border-primary text-primary hover:bg-primary/5"
              >
                <ContentSdkLink
                  field={
                    newCustomerLink || {
                      value: { href: '#', text: 'New Customers' },
                    }
                  }
                />
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

/** Default = column grid with height-capped cart posters */
export const Default = (props: YourCartProps): JSX.Element => (
  <YourCartView props={props} layout="columns" />
);

/** Columns = same as Default (multi-column card grid) */
export const Columns = (props: YourCartProps): JSX.Element => (
  <YourCartView props={props} layout="columns" />
);

/** Rows = stacked horizontal cards (image beside copy) */
export const Rows = (props: YourCartProps): JSX.Element => (
  <YourCartView props={props} layout="rows" />
);
