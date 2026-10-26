"use client";

import { useEffect, useState } from "react";
import type { CartSize } from "@/types/content";
import type { CartSizeInput } from "@/lib/sitecore/content-repository";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  initial?: Partial<CartSize> | null;
  submitLabel: string;
  onSubmit: (values: CartSizeInput) => Promise<void>;
  onCancel?: () => void;
};

export function CartSizeForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const [displayName, setDisplayName] = useState(initial?.displayName || "");
  const [code, setCode] = useState(initial?.code || "");
  const [capacity, setCapacity] = useState(initial?.capacity || "");
  const [unit, setUnit] = useState(initial?.unit || "Gallon");
  const [dimensions, setDimensions] = useState(initial?.dimensions || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(initial?.displayName || "");
    setCode(initial?.code || "");
    setCapacity(initial?.capacity || "");
    setUnit(initial?.unit || "Gallon");
    setDimensions(initial?.dimensions || "");
    setDescription(initial?.description || "");
    setError(null);
  }, [initial]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!displayName.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        displayName: displayName.trim(),
        code: code.trim(),
        capacity: capacity.trim(),
        unit: unit.trim(),
        dimensions: dimensions.trim(),
        description: description.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cart-size-name">Name</Label>
          <Input
            id="cart-size-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            placeholder="32-Gallon"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cart-size-code">Code</Label>
          <Input
            id="cart-size-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cart-size-capacity">Capacity</Label>
          <Input
            id="cart-size-capacity"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cart-size-unit">Unit</Label>
          <Input
            id="cart-size-unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="cart-size-dimensions">Dimensions</Label>
          <Input
            id="cart-size-dimensions"
            value={dimensions}
            onChange={(e) => setDimensions(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="cart-size-description">Description</Label>
        <Textarea
          id="cart-size-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>
      {error && (
        <p className="text-sm text-[#444444]" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={saving} className="rounded-full text-white">
          {saving ? "Saving..." : submitLabel}
        </Button>
        {onCancel && (
          <Button
            type="button"
            disabled={saving}
            className="rounded-full text-white"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
