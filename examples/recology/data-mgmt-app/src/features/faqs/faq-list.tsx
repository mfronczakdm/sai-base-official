"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { BehaviorStatusBadge } from "@/features/faqs/behavior-badge";
import { FaqEditorCard } from "@/features/faqs/faq-editor-card";
import type { GlobalFaqFormValues } from "@/features/faqs/global-faq-form";
import {
  displayAuthor,
  formatDisplayDate,
} from "@/lib/sitecore/field-utils";
import type { FaqRow, RegionalFaqBehavior } from "@/types/content";
import { cn } from "@/lib/utils";

type Props = {
  rows: FaqRow[];
  expandedId: string | null;
  onToggle: (id: string) => void;
  onSaveRegional: (input: {
    configId?: string;
    behavior: RegionalFaqBehavior;
    regionalSupportingInformation: string;
    regionalAnswer: string;
  }) => Promise<void>;
  onUpdateGlobal: (id: string, values: GlobalFaqFormValues) => Promise<void>;
  onDeleteGlobal: (id: string) => Promise<void>;
};

const ROW_GRID =
  "md:grid-cols-[minmax(0,1.6fr)_140px_88px_110px_110px_100px]";

export function FaqList({
  rows,
  expandedId,
  onToggle,
  onSaveRegional,
  onUpdateGlobal,
  onDeleteGlobal,
}: Props) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-white px-4 py-10 text-center text-sm text-muted-foreground">
        No FAQs match the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      <div
        className={cn(
          "hidden gap-3 border-b border-border bg-[#f7faf8] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid",
          ROW_GRID,
        )}
      >
        <span>Question</span>
        <span>Category</span>
        <span>Status</span>
        <span>Behavior</span>
        <span>Updated</span>
        <span>Author</span>
      </div>

      <ul className="divide-y divide-border">
        {rows.map((row) => {
          const expanded = expandedId === row.global.id;
          const author =
            displayAuthor(row.global.updatedBy) !== "—"
              ? displayAuthor(row.global.updatedBy)
              : displayAuthor(row.global.createdBy);

          return (
            <li key={row.global.id}>
              <button
                type="button"
                onClick={() => onToggle(row.global.id)}
                className={cn(
                  "grid w-full grid-cols-1 gap-2 px-4 py-3 text-left transition-colors hover:bg-[#f3f7f4] md:items-center md:gap-3",
                  ROW_GRID,
                  expanded && "bg-[#e8f6ec]",
                )}
                aria-expanded={expanded}
              >
                <span className="flex min-w-0 items-start gap-2">
                  <span className="mt-0.5 text-[#27a746]" aria-hidden="true">
                    {expanded ? (
                      <ChevronDown className="size-4" />
                    ) : (
                      <ChevronRight className="size-4" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-foreground">
                      {row.global.question}
                    </span>
                    <span className="mt-1 flex flex-wrap gap-2 md:hidden">
                      <BehaviorStatusBadge badge={row.badge} />
                      <StatusPill active={row.global.active} />
                    </span>
                  </span>
                </span>

                <span className="hidden truncate text-sm text-muted-foreground md:block">
                  {row.global.category || "—"}
                </span>
                <span className="hidden md:block">
                  <StatusPill active={row.global.active} />
                </span>
                <span className="hidden md:block">
                  <BehaviorStatusBadge badge={row.badge} />
                </span>
                <span className="hidden text-sm text-muted-foreground md:block">
                  {formatDisplayDate(row.global.updatedAt)}
                </span>
                <span className="hidden truncate text-sm text-muted-foreground md:block">
                  {author}
                </span>
              </button>

              {expanded ? (
                <div className="border-t border-border bg-[#fbfcfb] px-4 py-4 md:px-6">
                  <FaqEditorCard
                    row={row}
                    compact
                    onSaveRegional={onSaveRegional}
                    onUpdateGlobal={onUpdateGlobal}
                    onDeleteGlobal={onDeleteGlobal}
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        active ? "bg-[#e8f6ec] text-[#1f8a38]" : "bg-[#f5f5f5] text-[#6b6b6b]",
      )}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}
