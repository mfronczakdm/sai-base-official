import type { ImageField } from '@sitecore-content-sdk/nextjs';
import { getFieldValue, type CompatibleField } from '@/lib/component-props';

/** GraphQL may return ImageField via jsonValue, or raw DAM/external XML via `value`. */
export type SitecoreImageGraphField =
  | CompatibleField<ImageField>
  | { value?: string | ImageField['value'] }
  | ImageField
  | null
  | undefined;

const attributeValue = (xml: string, name: string): string => {
  const match = xml.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, 'i'));
  return match?.[1]?.trim() ?? '';
};

/** Rebuild { src, alt } from Sitecore DAM / external `<Image ... />` XML. */
export const hydrateExternalImageField = (xml: string): ImageField['value'] | undefined => {
  if (!xml || !xml.includes('<')) return undefined;
  const src = attributeValue(xml, 'src');
  if (!src) return undefined;
  return {
    src,
    alt: attributeValue(xml, 'alt'),
    width: attributeValue(xml, 'width') || undefined,
    height: attributeValue(xml, 'height') || undefined,
  };
};

export const extractImageSrc = (field: SitecoreImageGraphField): string => {
  const resolved = resolveImageFieldValue(field);
  return resolved?.src || '';
};

export const extractImageAlt = (field: SitecoreImageGraphField, fallback = ''): string => {
  const resolved = resolveImageFieldValue(field);
  return (resolved?.alt && String(resolved.alt)) || fallback;
};

export const resolveImageFieldValue = (
  field: SitecoreImageGraphField
): ImageField['value'] | undefined => {
  if (!field) return undefined;

  const asJson = getFieldValue(field as CompatibleField<ImageField>);
  const jsonValue = asJson?.value;
  if (jsonValue && typeof jsonValue === 'object' && typeof jsonValue.src === 'string' && jsonValue.src) {
    return jsonValue;
  }
  if (typeof jsonValue === 'string' && jsonValue.includes('<')) {
    return hydrateExternalImageField(jsonValue);
  }

  const rawValue = (field as { value?: unknown }).value;
  if (typeof rawValue === 'string' && rawValue.includes('<')) {
    return hydrateExternalImageField(rawValue);
  }
  if (rawValue && typeof rawValue === 'object' && typeof (rawValue as { src?: string }).src === 'string') {
    const src = (rawValue as { src: string }).src;
    if (src) return rawValue as ImageField['value'];
  }

  return undefined;
};
