"use client";

import { useEffect, useState } from "react";
import type { GlobalFaq } from "@/types/content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type GlobalFaqFormValues = {
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  active: boolean;
};

type Props = {
  initial?: Partial<GlobalFaq> | null;
  submitLabel: string;
  onSubmit: (values: GlobalFaqFormValues) => Promise<void>;
  onCancel?: () => void;
};

export function GlobalFaqForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const [question, setQuestion] = useState(initial?.question || "");
  const [answer, setAnswer] = useState(initial?.answer || "");
  const [category, setCategory] = useState(initial?.category || "");
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 100));
  const [active, setActive] = useState(initial?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQuestion(initial?.question || "");
    setAnswer(initial?.answer || "");
    setCategory(initial?.category || "");
    setSortOrder(String(initial?.sortOrder ?? 100));
    setActive(initial?.active ?? true);
    setError(null);
  }, [initial]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!question.trim()) {
      setError("Question is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        question: question.trim(),
        answer,
        category: category.trim(),
        sortOrder: Number.parseInt(sortOrder, 10) || 100,
        active,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="global-question">Question</Label>
        <Input
          id="global-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="global-answer">Answer</Label>
        <Textarea
          id="global-answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={6}
          placeholder="HTML or plain text is accepted"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="global-category">Category</Label>
          <Input
            id="global-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="global-sort">Sort order</Label>
          <Input
            id="global-sort"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="size-4 accent-[#27a746]"
        />
        Active
      </label>

      {error && (
        <p className="text-sm text-[#444444]" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : submitLabel}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
