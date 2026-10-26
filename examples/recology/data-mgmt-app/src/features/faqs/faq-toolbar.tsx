"use client";

import {
  DEFAULT_FAQ_FILTERS,
  type ActiveFilter,
  type BehaviorFilter,
  type FaqFilterState,
  type FaqSort,
} from "@/features/faqs/faq-filters";
import { displayAuthor } from "@/lib/sitecore/field-utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  filters: FaqFilterState;
  onChange: (next: FaqFilterState) => void;
  categories: string[];
  authors: string[];
  resultCount: number;
  totalCount: number;
};

const BEHAVIOR_OPTIONS: Array<{ value: BehaviorFilter; label: string }> = [
  { value: "all", label: "All behaviors" },
  { value: "INHERITED", label: "Inherited" },
  { value: "EXTENDED", label: "Extended" },
  { value: "OVERRIDDEN", label: "Overridden" },
  { value: "EXCLUDED", label: "Excluded" },
  { value: "GLOBAL", label: "Global only" },
];

const ACTIVE_OPTIONS: Array<{ value: ActiveFilter; label: string }> = [
  { value: "all", label: "All status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const SORT_OPTIONS: Array<{ value: FaqSort; label: string }> = [
  { value: "sortOrder", label: "Sort order" },
  { value: "question", label: "Question A-Z" },
  { value: "updated", label: "Recently updated" },
  { value: "created", label: "Recently created" },
  { value: "author", label: "Author" },
];

export function FaqToolbar({
  filters,
  onChange,
  categories,
  authors,
  resultCount,
  totalCount,
}: Props) {
  const hasFilters =
    filters.query ||
    filters.active !== "all" ||
    filters.behavior !== "all" ||
    filters.category !== "all" ||
    filters.author !== "all" ||
    filters.sort !== "sortOrder";

  return (
    <div className="space-y-3 rounded-xl border border-border bg-white p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-[220px] flex-1 space-y-1.5">
          <Label htmlFor="faq-search">Search</Label>
          <Input
            id="faq-search"
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
            placeholder="Search question, answer, category, author..."
            className="h-9"
          />
        </div>
        <p className="pb-2 text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{resultCount}</span> of{" "}
          {totalCount}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <FilterSelect
          label="Status"
          value={filters.active}
          items={ACTIVE_OPTIONS}
          onChange={(active) => onChange({ ...filters, active })}
        />
        <FilterSelect
          label="Regional behavior"
          value={filters.behavior}
          items={BEHAVIOR_OPTIONS}
          onChange={(behavior) => onChange({ ...filters, behavior })}
        />
        <FilterSelect
          label="Category"
          value={filters.category}
          items={[
            { value: "all", label: "All categories" },
            ...categories.map((category) => ({
              value: category,
              label: category,
            })),
          ]}
          onChange={(category) => onChange({ ...filters, category })}
        />
        <FilterSelect
          label="Author"
          value={filters.author}
          items={[
            { value: "all", label: "All authors" },
            ...authors.map((author) => ({
              value: author,
              label: displayAuthor(author),
            })),
          ]}
          onChange={(author) => onChange({ ...filters, author })}
        />
        <FilterSelect
          label="Sort by"
          value={filters.sort}
          items={SORT_OPTIONS}
          onChange={(sort) => onChange({ ...filters, sort })}
        />
      </div>

      {hasFilters && (
        <div>
          <Button
            type="button"
            size="sm"
            className="rounded-full text-white"
            onClick={() => onChange(DEFAULT_FAQ_FILTERS)}
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}

function FilterSelect<T extends string>({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value: T;
  items: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select
        value={value}
        onValueChange={(next) => {
          if (next) onChange(next as T);
        }}
        items={items.map((item) => ({
          value: item.value,
          label: item.label,
        }))}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
