/**
 * HeroST Advanced styling helpers.
 * Droplist params store the Enumeration item name (e.g. "40").
 */

const HEIGHT_MIN = 10;
const HEIGHT_MAX = 100;

/** Parse HeroHeight rendering param as viewport % (e.g. "40" → 40). */
export const parseHeroHeightVh = (params?: { [key: string]: string }): number | undefined => {
  const raw = params?.HeroHeight?.trim();
  if (!raw) return undefined;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < HEIGHT_MIN || n > HEIGHT_MAX) return undefined;
  return n;
};

/** Inline min-height from HeroHeight, or undefined when unset (variants keep defaults). */
export const heroHeightStyle = (
  params?: { [key: string]: string }
): { minHeight: string } | undefined => {
  const vh = parseHeroHeightVh(params);
  if (vh === undefined) return undefined;
  return { minHeight: `${vh}vh` };
};

/** True when author set HeroHeight — skip hardcoded min-h-* that would fight the param. */
export const hasHeroHeight = (params?: { [key: string]: string }): boolean =>
  parseHeroHeightVh(params) !== undefined;
