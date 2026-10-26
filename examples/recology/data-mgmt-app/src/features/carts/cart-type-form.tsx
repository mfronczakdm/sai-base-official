"use client";

import { useEffect, useState } from "react";
import type { CartType } from "@/types/content";
import type { CartTypeInput } from "@/lib/sitecore/content-repository";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  initial?: Partial<CartType> | null;
  submitLabel: string;
  onSubmit: (values: CartTypeInput) => Promise<void>;
  onCancel?: () => void;
};

export function CartTypeForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const [displayName, setDisplayName] = useState(initial?.displayName || "");
  const [code, setCode] = useState(initial?.code || "");
  const [color, setColor] = useState(initial?.color || "");
  const [stream, setStream] = useState(initial?.stream || "");
  const [capacity, setCapacity] = useState(initial?.capacity || "");
  const [unit, setUnit] = useState(initial?.unit || "");
  const [containerType, setContainerType] = useState(
    initial?.containerType || "",
  );
  const [dimensions, setDimensions] = useState(initial?.dimensions || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(initial?.displayName || "");
    setCode(initial?.code || "");
    setColor(initial?.color || "");
    setStream(initial?.stream || "");
    setCapacity(initial?.capacity || "");
    setUnit(initial?.unit || "");
    setContainerType(initial?.containerType || "");
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
        color: color.trim(),
        stream: stream.trim(),
        capacity: capacity.trim(),
        unit: unit.trim(),
        containerType: containerType.trim(),
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
        <Field label="Name" value={displayName} onChange={setDisplayName} required />
        <Field label="Code" value={code} onChange={setCode} />
        <Field
          label="Color"
          value={color}
          onChange={setColor}
          placeholder="Green, Blue, Black or Gray"
        />
        <Field
          label="Stream"
          value={stream}
          onChange={setStream}
          placeholder="Compost / Organics, Recycling, Landfill"
        />
        <Field label="Capacity" value={capacity} onChange={setCapacity} />
        <Field label="Unit" value={unit} onChange={setUnit} />
        <Field
          label="Container type"
          value={containerType}
          onChange={setContainerType}
        />
        <Field label="Dimensions" value={dimensions} onChange={setDimensions} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cart-type-description">Description / accepted materials</Label>
        <Textarea
          id="cart-type-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
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

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  const id = `cart-type-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
      />
    </div>
  );
}
