import type { Field, LinkField, RichTextField } from '@sitecore-content-sdk/nextjs';
import { getFieldValue } from '@/lib/component-props';
import type {
  GlobalFaqItem,
  RegionalFaqBehavior,
  RegionalFaqConfigurationItem,
  ResolvedRegionalFaq,
} from './regional-faq.props';

const BEHAVIORS: RegionalFaqBehavior[] = [
  'UseGlobal',
  'AddRegionalInformation',
  'Override',
  'Exclude',
];

const fieldText = (field?: { jsonValue?: Field<string>; value?: string } | null): string => {
  const value = getFieldValue(field)?.value ?? field?.value;
  return typeof value === 'string' ? value.trim() : '';
};

const hasRichText = (field?: { jsonValue?: RichTextField; value?: string } | null): boolean =>
  Boolean(getFieldValue(field)?.value?.toString().trim() || field?.value?.toString().trim());

const isChecked = (field?: { jsonValue?: Field<boolean | string>; value?: boolean | string } | null): boolean => {
  const value = getFieldValue(field)?.value ?? field?.value;
  return value === true || value === '1' || value === 'true';
};

const parseSortOrder = (
  regional?: { jsonValue?: Field<string | number>; value?: string | number } | null,
  global?: { jsonValue?: Field<string | number>; value?: string | number } | null,
  fallback = 100
): number => {
  const raw = getFieldValue(regional)?.value ?? regional?.value ?? getFieldValue(global)?.value ?? global?.value;
  const num = typeof raw === 'number' ? raw : Number.parseInt(String(raw ?? ''), 10);
  return Number.isFinite(num) ? num : fallback;
};

const normalizeBehavior = (raw?: string | null): RegionalFaqBehavior => {
  const value = (raw || '').trim();
  if (BEHAVIORS.includes(value as RegionalFaqBehavior)) {
    return value as RegionalFaqBehavior;
  }
  return 'UseGlobal';
};

const readBehavior = (config?: RegionalFaqConfigurationItem | null): RegionalFaqBehavior => {
  if (!config) return 'UseGlobal';
  const fromKey = fieldText(config.behaviorKey);
  if (fromKey) return normalizeBehavior(fromKey);
  const fromDroplist = fieldText(config.behavior);
  if (fromDroplist) return normalizeBehavior(fromDroplist);
  const fromTarget = config.behavior?.targetItem?.name || fieldText(config.behavior?.targetItem?.key);
  if (fromTarget) return normalizeBehavior(fromTarget);
  return 'UseGlobal';
};

const isActiveField = (field?: { jsonValue?: Field<boolean | string>; value?: boolean | string } | null): boolean => {
  if (field == null) return true;
  const value = getFieldValue(field)?.value ?? field?.value;
  if (value === undefined || value === null || value === '') return true;
  return isChecked(field);
};

/** Sitecore empty dates often serialize as DateTime.MinValue over GraphQL/Edge. */
const isUsableSitecoreDate = (raw?: string | null): Date | null => {
  if (!raw?.trim()) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  // Ignore unset / sentinel values (year 1 or earlier).
  if (date.getUTCFullYear() <= 1) return null;
  return date;
};

const withinDateWindow = (config?: RegionalFaqConfigurationItem | null, now = new Date()): boolean => {
  if (!config) return true;
  const effective = isUsableSitecoreDate(fieldText(config.effectiveDate));
  if (effective && now < effective) return false;
  const expiration = isUsableSitecoreDate(fieldText(config.expirationDate));
  if (expiration && now > expiration) return false;
  return true;
};

const resolveGlobalFaq = (config?: RegionalFaqConfigurationItem | null): GlobalFaqItem | undefined => {
  if (!config) return undefined;
  const fromMultilist = config.globalFaq?.targetItems?.[0];
  if (fromMultilist) return fromMultilist;
  if (config.globalFaq?.targetItem) return config.globalFaq.targetItem;
  return undefined;
};

/**
 * Resolves one global FAQ against an optional regional configuration.
 * Returns null when the FAQ must not render (Exclude, inactive, missing question).
 */
export const resolveRegionalFaq = (
  globalFaq: GlobalFaqItem | null | undefined,
  regionalConfiguration?: RegionalFaqConfigurationItem | null
): ResolvedRegionalFaq | null => {
  try {
    if (regionalConfiguration && !isActiveField(regionalConfiguration.active)) {
      return null;
    }

    if (regionalConfiguration && !withinDateWindow(regionalConfiguration)) {
      return null;
    }

    const behavior = readBehavior(regionalConfiguration);

    if (behavior === 'Exclude') {
      return null;
    }

    const global = globalFaq || resolveGlobalFaq(regionalConfiguration);
    if (!global) {
      return null;
    }

    if (!isActiveField(global.active)) {
      return null;
    }

    const questionField = getFieldValue(global.question) || global.question?.jsonValue;
    const questionText = fieldText(global.question);
    if (!questionText && !questionField) {
      return null;
    }

    const globalAnswerField = getFieldValue(global.answer) || global.answer?.jsonValue;
    const regionalAnswerField =
      getFieldValue(regionalConfiguration?.regionalAnswer) ||
      regionalConfiguration?.regionalAnswer?.jsonValue;
    const supportingField =
      getFieldValue(regionalConfiguration?.regionalSupportingInformation) ||
      regionalConfiguration?.regionalSupportingInformation?.jsonValue;

    const contactCta =
      getFieldValue(regionalConfiguration?.contactCta) ||
      regionalConfiguration?.contactCta?.jsonValue;

    const sortOrder = parseSortOrder(regionalConfiguration?.sortOrder, global.sortOrder);
    const category = fieldText(global.category) || global.category?.targetItem?.name || undefined;
    const id = regionalConfiguration?.id || global.id || questionText;

    const base = {
      id,
      question: questionField || { value: questionText },
      category,
      sortOrder,
      contactCta: contactCta as LinkField | undefined,
      globalAnswer: hasRichText(global.answer) ? globalAnswerField : undefined,
    };

    switch (behavior) {
      case 'Override': {
        const resolved = hasRichText(regionalConfiguration?.regionalAnswer)
          ? regionalAnswerField
          : globalAnswerField;
        if (!resolved) return null;
        return {
          ...base,
          behavior: 'Override',
          resolvedAnswer: resolved,
        };
      }
      case 'AddRegionalInformation': {
        if (!globalAnswerField) return null;
        return {
          ...base,
          behavior: 'AddRegionalInformation',
          resolvedAnswer: globalAnswerField,
          regionalSupportingInformation: hasRichText(
            regionalConfiguration?.regionalSupportingInformation
          )
            ? supportingField
            : undefined,
        };
      }
      case 'UseGlobal':
      default: {
        if (!globalAnswerField) return null;
        return {
          ...base,
          behavior: 'UseGlobal',
          resolvedAnswer: globalAnswerField,
        };
      }
    }
  } catch {
    return null;
  }
};

export const resolveRegionalFaqList = (
  configurations: RegionalFaqConfigurationItem[] | null | undefined
): ResolvedRegionalFaq[] => {
  const items = (configurations || [])
    .map((config) => resolveRegionalFaq(resolveGlobalFaq(config), config))
    .filter((item): item is ResolvedRegionalFaq => Boolean(item));

  return items.sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
};
