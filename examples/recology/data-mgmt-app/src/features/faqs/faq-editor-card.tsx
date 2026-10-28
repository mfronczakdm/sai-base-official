"use client";

import { useEffect, useState } from "react";
import { BehaviorStatusBadge } from "@/features/faqs/behavior-badge";
import {
  GlobalFaqForm,
  type GlobalFaqFormValues,
} from "@/features/faqs/global-faq-form";
import { htmlToPlainText, plainTextToHtml } from "@/lib/html-text";
import {
  displayAuthor,
  formatDisplayDate,
} from "@/lib/sitecore/field-utils";
import { FAQ_BEHAVIORS } from "@/lib/sitecore/paths";
import type { FaqRow, RegionalFaqBehavior, RegionalFaqSaveInput } from "@/types/content";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

type Props = {
  row: FaqRow;
  compact?: boolean;
  onSaveRegional: (input: RegionalFaqSaveInput) => Promise<void>;
  onUpdateGlobal: (id: string, values: GlobalFaqFormValues) => Promise<void>;
  onDeleteGlobal: (id: string) => Promise<void>;
};

export function FaqEditorCard({
  row,
  compact = false,
  onSaveRegional,
  onUpdateGlobal,
  onDeleteGlobal,
}: Props) {
  const [behavior, setBehavior] = useState<RegionalFaqBehavior>(row.behavior);
  const [supporting, setSupporting] = useState(
    htmlToPlainText(row.config?.regionalSupportingInformation || ""),
  );
  const [overrideAnswer, setOverrideAnswer] = useState(
    htmlToPlainText(row.config?.regionalAnswer || ""),
  );
  const [editingGlobal, setEditingGlobal] = useState(false);
  const [savingRegional, setSavingRegional] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBehavior(row.behavior);
    setSupporting(htmlToPlainText(row.config?.regionalSupportingInformation || ""));
    setOverrideAnswer(htmlToPlainText(row.config?.regionalAnswer || ""));
    setEditingGlobal(false);
    setMessage(null);
    setError(null);
  }, [row]);

  const handleSaveRegional = async () => {
    setSavingRegional(true);
    setMessage(null);
    setError(null);
    try {
      await onSaveRegional({
        globalFaqId: row.global.id,
        configId: row.config?.id,
        behavior,
        regionalSupportingInformation: plainTextToHtml(supporting),
        regionalAnswer: plainTextToHtml(overrideAnswer),
      });
      setMessage("Saved regional FAQ configuration.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingRegional(false);
    }
  };

  const handleUpdateGlobal = async (values: GlobalFaqFormValues) => {
    setMessage(null);
    setError(null);
    await onUpdateGlobal(row.global.id, values);
    setEditingGlobal(false);
    setMessage("Updated global FAQ.");
  };

  const handleDeleteGlobal = async () => {
    const confirmed = window.confirm(
      `Delete global FAQ "${row.global.question}"?\n\nThis removes it from all regions. Regional FAQ Configuration items that reference it may need cleanup in Sitecore.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    setMessage(null);
    setError(null);
    try {
      await onDeleteGlobal(row.global.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
    }
  };

  return (
    <div className={compact ? "space-y-5" : "rounded-xl border bg-white p-5 space-y-5"}>
      {!compact && (
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold leading-snug">{row.global.question}</h3>
            {row.global.category && (
              <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                {row.global.category}
              </p>
            )}
          </div>
          <BehaviorStatusBadge badge={row.badge} />
        </div>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-foreground">Global FAQ</h4>
          {!editingGlobal && (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                className="rounded-full text-white"
                onClick={() => setEditingGlobal(true)}
              >
                Edit global
              </Button>
              <Button
                type="button"
                size="sm"
                className="rounded-full text-white"
                disabled={deleting}
                onClick={() => void handleDeleteGlobal()}
              >
                {deleting ? "Deleting..." : "Delete global"}
              </Button>
            </div>
          )}
        </div>

        <dl className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <MetaItem label="Created" value={formatDisplayDate(row.global.createdAt)} />
          <MetaItem label="Updated" value={formatDisplayDate(row.global.updatedAt)} />
          <MetaItem
            label="Created by"
            value={displayAuthor(row.global.createdBy)}
          />
          <MetaItem
            label="Updated by"
            value={displayAuthor(row.global.updatedBy)}
          />
        </dl>

        {editingGlobal ? (
          <div className="rounded-lg border border-border bg-white p-4">
            <GlobalFaqForm
              initial={row.global}
              submitLabel="Update global FAQ"
              onSubmit={handleUpdateGlobal}
              onCancel={() => setEditingGlobal(false)}
            />
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-white p-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Answer
            </p>
            <p className="whitespace-pre-wrap text-sm text-foreground">
              {htmlToPlainText(row.global.answer) || "Empty"}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Sort {row.global.sortOrder}
              {row.global.active ? " · Active" : " · Inactive"}
            </p>
          </div>
        )}
      </section>

      <Separator />

      <section className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">
          Regional behavior
        </h4>

        <div className="space-y-2">
          <Label>Behavior for this region</Label>
          <Select
            value={behavior}
            onValueChange={(value) => {
              if (value) setBehavior(value as RegionalFaqBehavior);
            }}
            items={FAQ_BEHAVIORS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          >
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select behavior" />
            </SelectTrigger>
            <SelectContent>
              {FAQ_BEHAVIORS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {behavior === "UseGlobal" && (
          <Alert>
            <AlertDescription>
              This region inherits the global answer. No regional copy is stored.
            </AlertDescription>
          </Alert>
        )}

        {behavior === "AddRegionalInformation" && (
          <div className="space-y-2">
            <Label htmlFor={`support-${row.global.id}`}>
              Regional supporting information
            </Label>
            <Textarea
              id={`support-${row.global.id}`}
              value={supporting}
              onChange={(e) => setSupporting(e.target.value)}
              rows={4}
            />
          </div>
        )}

        {behavior === "Override" && (
          <div className="space-y-2">
            <Label htmlFor={`override-${row.global.id}`}>Regional override</Label>
            <Textarea
              id={`override-${row.global.id}`}
              value={overrideAnswer}
              onChange={(e) => setOverrideAnswer(e.target.value)}
              rows={4}
            />
          </div>
        )}

        {behavior === "Exclude" && (
          <Alert variant="warning">
            <AlertDescription>
              The FAQ remains globally, but will not render for this region.
            </AlertDescription>
          </Alert>
        )}

        {!row.config && (
          <Alert>
            <AlertDescription>
              No Regional FAQ Configuration exists for this question yet. Saving
              creates one under this region&apos;s collection.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            className="rounded-full text-white"
            onClick={() => void handleSaveRegional()}
            disabled={savingRegional}
          >
            {savingRegional ? "Saving..." : "Save regional"}
          </Button>
          {message && <p className="text-sm text-[#1f8a38]">{message}</p>}
          {error && (
            <p className="text-sm text-[#444444]" role="alert">
              {error}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white px-3 py-2 ring-1 ring-border">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-sm text-foreground">{value}</dd>
    </div>
  );
}
