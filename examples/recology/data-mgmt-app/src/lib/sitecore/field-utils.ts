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
