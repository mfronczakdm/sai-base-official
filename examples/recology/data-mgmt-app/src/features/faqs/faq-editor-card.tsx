"use client";

import { useEffect, useState } from "react";
import { BehaviorStatusBadge } from "@/features/faqs/behavior-badge";
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

type Props = {
  row: FaqRow;
  onSave: (input: {
    configId?: string;
    behavior: RegionalFaqBehavior;
    regionalSupportingInformation: string;
    regionalAnswer: string;
  }) => Promise<void>;
};

export function FaqEditorCard({ row, onSave }: Props) {
  const [behavior, setBehavior] = useState<RegionalFaqBehavior>(row.behavior);
  const [supporting, setSupporting] = useState(
    row.config?.regionalSupportingInformation || "",
  );
  const [overrideAnswer, setOverrideAnswer] = useState(
    row.config?.regionalAnswer || "",
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBehavior(row.behavior);
    setSupporting(row.config?.regionalSupportingInformation || "");
    setOverrideAnswer(row.config?.regionalAnswer || "");
    setMessage(null);
    setError(null);
  }, [row]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await onSave({
        configId: row.config?.id,
        behavior,
        regionalSupportingInformation: supporting,
        regionalAnswer: overrideAnswer,
      });
      setMessage("Saved regional FAQ configuration.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
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
      <CardContent className="space-y-4">
        <div className="rounded-md border bg-muted/30 p-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Global answer
          </p>
          <div
            className="prose prose-sm max-w-none text-sm"
            dangerouslySetInnerHTML={{ __html: row.global.answer || "<em>Empty</em>" }}
          />
        </div>

        <div className="space-y-2">
          <Label>Regional behavior</Label>
          <Select
            value={behavior}
            onValueChange={(value) => {
              if (value) setBehavior(value as RegionalFaqBehavior);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
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
              the selected region&apos;s collection yet. Saving updates only
              works when a configuration item already exists (create in CM /
              Collections first).
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-3">
          <Button onClick={() => void handleSave()} disabled={saving || !row.config}>
            {saving ? "Saving..." : "Save"}
          </Button>
          {message && <p className="text-sm text-emerald-700">{message}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
