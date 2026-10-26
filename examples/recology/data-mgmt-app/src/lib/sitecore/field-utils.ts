import type { RegionalFaqBehavior } from "@/types/content";
import type { SitecoreFieldMap } from "@/types/content";

export function fieldValue(
  fields: SitecoreFieldMap,
  ...names: string[]
): string {
  for (const name of names) {
    const value = fields[name];
    if (value != null && String(value).trim() !== "") {
      return String(value);
    }
  }
  return "";
}

export function isChecked(raw: string | undefined | null): boolean {
  if (raw == null || raw === "") return true;
  return raw === "1" || raw === "true" || raw === "True";
}

export function parseSortOrder(raw: string | undefined, fallback = 100): number {
  const n = Number.parseInt(String(raw ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

/** Treelist / multilist raw value: {GUID}|{GUID} */
export function parseIdList(raw: string): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split("|")
    .map((part) => part.replace(/[{}]/g, "").trim().toUpperCase())
    .filter(Boolean);
}

export function normalizeGuid(id: string): string {
  return id.replace(/[{}]/g, "").replace(/-/g, "").toUpperCase();
}

export function guidsEqual(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  return normalizeGuid(a) === normalizeGuid(b);
}

export function normalizeBehavior(raw?: string): RegionalFaqBehavior {
  const value = (raw || "").trim();
  if (
    value === "UseGlobal" ||
    value === "AddRegionalInformation" ||
    value === "Override" ||
    value === "Exclude"
  ) {
    return value;
  }
  return "UseGlobal";
}

export function nodesToFieldMap(
  nodes?: Array<{ name?: string; value?: string } | null> | null,
): SitecoreFieldMap {
  const map: SitecoreFieldMap = {};
  for (const node of nodes || []) {
    if (node?.name) {
      map[node.name] = node.value ?? "";
    }
  }
  return map;
}

/** Sitecore standard dates are often `yyyyMMddTHHmmssZ`. */
export function parseSitecoreDate(raw?: string): string | undefined {
  if (!raw?.trim()) return undefined;
  const value = raw.trim();
  if (/^0001/.test(value)) return undefined;

  const compact = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/.exec(value);
  if (compact) {
    const iso = `${compact[1]}-${compact[2]}-${compact[3]}T${compact[4]}:${compact[5]}:${compact[6]}Z`;
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function formatDisplayDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

export function displayAuthor(raw?: string): string {
  if (!raw?.trim()) return "—";
  // Sitecore often stores `sitecore\username`
  const parts = raw.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1] || raw;
}

/** Format a GUID for Sitecore multilist / droplink field values. */
export function formatGuidBraced(id: string): string {
  const hex = id.replace(/[{}-]/g, "").toUpperCase();
  if (hex.length !== 32) {
    return `{${id.replace(/[{}]/g, "")}}`;
  }
  return `{${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}}`;
}

export function toMultilistValue(ids: string[]): string {
  return ids.map(formatGuidBraced).join("|");
}
