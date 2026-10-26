"use client";

import { useEffect, useState } from "react";
import { BehaviorStatusBadge } from "@/features/faqs/behavior-badge";
import {
  GlobalFaqForm,
  type GlobalFaqFormValues,
} from "@/features/faqs/global-faq-form";
import { htmlToPlainText, plainTextToHtml } from "@/lib/html-text";
import { FAQ_BEHAVIORS } from "@/lib/sitecore/paths";
import type { FaqRow, RegionalFaqBehavior } from "@/types/content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  onSaveRegional: (input: {
    configId?: string;
    behavior: RegionalFaqBehavior;
    regionalSupportingInformation: string;
    regionalAnswer: string;
  }) => Promise<void>;
  onUpdateGlobal: (id: string, values: GlobalFaqFormValues) => Promise<void>;
  onDeleteGlobal: (id: string) => Promise<void>;
};

export function FaqEditorCard({
  row,
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
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-lg leading-snug">{row.global.question}</CardTitle>
          <BehaviorStatusBadge badge={row.badge} />
        </div>
        {row.global.category && (
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {row.global.category}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Global FAQ
            </h3>
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

          {editingGlobal ? (
            <div className="rounded-md border border-border bg-white p-4">
              <GlobalFaqForm
                initial={row.global}
                submitLabel="Update global FAQ"
                onSubmit={handleUpdateGlobal}
                onCancel={() => setEditingGlobal(false)}
              />
            </div>
          ) : (
            <div className="rounded-md border bg-muted/40 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Global answer
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
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Regional behavior
          </h3>

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
              <SelectTrigger className="w-full">
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
                rows={5}
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
                rows={5}
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
            <Alert variant="warning">
              <AlertDescription>
                No Regional FAQ Configuration item exists for this Global FAQ in
                the selected region&apos;s collection yet. Saving regional updates
                only works when a configuration item already exists.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              className="rounded-full text-white"
              onClick={() => void handleSaveRegional()}
              disabled={savingRegional || !row.config}
            >
              {savingRegional ? "Saving..." : "Save regional"}
            </Button>
            {message && <p className="text-sm text-[#1f8a38]">{message}</p>}
            {error && <p className="text-sm text-[#444444]" role="alert">{error}</p>}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
