import type { BehaviorBadge, FaqRow } from "@/types/content";

export type ActiveFilter = "all" | "active" | "inactive";
export type BehaviorFilter = "all" | BehaviorBadge;
export type FaqSort =
  | "sortOrder"
  | "question"
  | "updated"
  | "created"
  | "author";

export type FaqFilterState = {
  query: string;
  active: ActiveFilter;
  behavior: BehaviorFilter;
  category: string;
  author: string;
  sort: FaqSort;
};

export const DEFAULT_FAQ_FILTERS: FaqFilterState = {
  query: "",
  active: "all",
  behavior: "all",
  category: "all",
  author: "all",
  sort: "sortOrder",
};

export function uniqueCategories(rows: FaqRow[]): string[] {
  return Array.from(
    new Set(
      rows
        .map((row) => row.global.category?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

export function uniqueAuthors(rows: FaqRow[]): string[] {
  return Array.from(
    new Set(
      rows
        .flatMap((row) => [row.global.updatedBy, row.global.createdBy])
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

export function filterAndSortFaqs(
  rows: FaqRow[],
  filters: FaqFilterState,
): FaqRow[] {
  const q = filters.query.trim().toLowerCase();

  const filtered = rows.filter((row) => {
    if (filters.active === "active" && !row.global.active) return false;
    if (filters.active === "inactive" && row.global.active) return false;
    if (filters.behavior !== "all" && row.badge !== filters.behavior) return false;
    if (filters.category !== "all" && row.global.category !== filters.category) {
      return false;
    }
    if (filters.author !== "all") {
      const authors = [row.global.updatedBy, row.global.createdBy]
        .filter(Boolean)
        .map((value) => value!.toLowerCase());
      if (!authors.some((author) => author === filters.author.toLowerCase())) {
        return false;
      }
    }
    if (!q) return true;
    const haystack = [
      row.global.question,
      row.global.answer,
      row.global.category,
      row.global.createdBy,
      row.global.updatedBy,
      row.badge,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (filters.sort) {
      case "question":
        return a.global.question.localeCompare(b.global.question);
      case "updated":
        return (b.global.updatedAt || "").localeCompare(a.global.updatedAt || "");
      case "created":
        return (b.global.createdAt || "").localeCompare(a.global.createdAt || "");
      case "author": {
        const authorA = a.global.updatedBy || a.global.createdBy || "";
        const authorB = b.global.updatedBy || b.global.createdBy || "";
        return authorA.localeCompare(authorB);
      }
      case "sortOrder":
      default:
        return (
          a.global.sortOrder - b.global.sortOrder ||
          a.global.question.localeCompare(b.global.question)
        );
    }
  });

  return sorted;
}
