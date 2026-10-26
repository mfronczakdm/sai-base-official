"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { CartRate, CartSize } from "@/types/content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type RateDraft = {
  name: string;
  cartSizeId: string;
  monthlyRate: string;
  dimensions: string;
  typicalWeeklyNeeds: string;
};

type Props = {
  rates: CartRate[];
  cartSizes: CartSize[];
  onCreate: (values: RateDraft) => Promise<void>;
  onUpdate: (id: string, values: RateDraft) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export function CartRatesList({
  rates,
  cartSizes,
  onCreate,
  onUpdate,
  onDelete,
}: Props) {
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section className="space-y-3 rounded-xl border border-border bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Regional cart rates</h3>
          <p className="text-sm text-muted-foreground">
            LocationCartRate items for this region (monthly rate, dimensions,
            weekly needs).
          </p>
        </div>
        {!creating && (
          <Button
            type="button"
            size="sm"
            className="rounded-full text-white"
            onClick={() => {
              setCreating(true);
              setExpandedId(null);
            }}
          >
            Add cart rate
          </Button>
        )}
      </div>

      {creating && (
        <div className="rounded-lg border border-border bg-[#fbfcfb] p-4">
          <RateForm
            cartSizes={cartSizes}
            submitLabel="Create cart rate"
            onSubmit={async (values) => {
              await onCreate(values);
              setCreating(false);
            }}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-border">
        <ul className="divide-y divide-border">
          {rates.map((rate) => {
            const open = expandedId === rate.id;
            return (
              <li key={rate.id}>
                <button
                  type="button"
                  className={cn(
                    "grid w-full grid-cols-1 gap-1 px-3 py-2.5 text-left hover:bg-[#f3f7f4] sm:grid-cols-[1fr_120px_1fr] sm:items-center",
                    open && "bg-[#e8f6ec]",
                  )}
                  onClick={() => setExpandedId(open ? null : rate.id)}
                >
                  <span className="flex items-center gap-2 font-medium">
                    {open ? (
                      <ChevronDown className="size-4 text-[#27a746]" />
                    ) : (
                      <ChevronRight className="size-4 text-[#27a746]" />
                    )}
                    {rate.name}
                  </span>
                  <span className="pl-6 text-sm text-muted-foreground sm:pl-0">
                    {rate.monthlyRate || "—"}
                  </span>
                  <span className="hidden truncate text-sm text-muted-foreground sm:block">
                    {rate.dimensions || "—"}
                  </span>
                </button>
                {open ? (
                  <div className="border-t border-border bg-[#fbfcfb] p-4">
                    <RateForm
                      cartSizes={cartSizes}
                      initial={rate}
                      submitLabel="Update cart rate"
                      onSubmit={async (values) => {
                        await onUpdate(rate.id, values);
                      }}
                      onDelete={async () => {
                        if (window.confirm(`Delete cart rate "${rate.name}"?`)) {
                          await onDelete(rate.id);
                          setExpandedId(null);
                        }
                      }}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
          {!rates.length && (
            <li className="px-3 py-8 text-center text-sm text-muted-foreground">
              No cart rates for this region yet.
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}

function RateForm({
  cartSizes,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  onDelete,
}: {
  cartSizes: CartSize[];
  initial?: CartRate;
  submitLabel: string;
  onSubmit: (values: RateDraft) => Promise<void>;
  onCancel?: () => void;
  onDelete?: () => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [cartSizeId, setCartSizeId] = useState(initial?.cartSizeId || "");
  const [monthlyRate, setMonthlyRate] = useState(initial?.monthlyRate || "");
  const [dimensions, setDimensions] = useState(initial?.dimensions || "");
  const [typicalWeeklyNeeds, setTypicalWeeklyNeeds] = useState(
    initial?.typicalWeeklyNeeds || "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(initial?.name || "");
    setCartSizeId(initial?.cartSizeId || "");
    setMonthlyRate(initial?.monthlyRate || "");
    setDimensions(initial?.dimensions || "");
    setTypicalWeeklyNeeds(initial?.typicalWeeklyNeeds || "");
    setError(null);
  }, [initial]);

  const applySizeDefaults = (sizeId: string) => {
    setCartSizeId(sizeId);
    const size = cartSizes.find((item) => item.id === sizeId);
    if (!size) return;
    if (!name.trim()) setName(size.displayName);
    if (!dimensions.trim()) setDimensions(size.dimensions);
    if (!typicalWeeklyNeeds.trim()) setTypicalWeeklyNeeds(size.description);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        cartSizeId,
        monthlyRate: monthlyRate.trim(),
        dimensions: dimensions.trim(),
        typicalWeeklyNeeds: typicalWeeklyNeeds.trim(),
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
          <Label htmlFor="rate-name">Name</Label>
          <Input
            id="rate-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={Boolean(initial)}
          />
        </div>
        <div className="space-y-2">
          <Label>Cart size</Label>
          <Select
            value={cartSizeId || null}
            onValueChange={(value) => {
              if (value) applySizeDefaults(value);
            }}
            items={cartSizes.map((size) => ({
              value: size.id,
              label: size.displayName,
            }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a size" />
            </SelectTrigger>
            <SelectContent>
              {cartSizes.map((size) => (
                <SelectItem key={size.id} value={size.id}>
                  {size.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="rate-monthly">Monthly rate</Label>
          <Input
            id="rate-monthly"
            value={monthlyRate}
            onChange={(e) => setMonthlyRate(e.target.value)}
            placeholder="$34.80"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rate-dimensions">Dimensions</Label>
          <Input
            id="rate-dimensions"
            value={dimensions}
            onChange={(e) => setDimensions(e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="rate-needs">Typical weekly needs</Label>
          <Input
            id="rate-needs"
            value={typicalWeeklyNeeds}
            onChange={(e) => setTypicalWeeklyNeeds(e.target.value)}
          />
        </div>
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
            className="rounded-full text-white"
            disabled={saving}
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        {onDelete && (
          <Button
            type="button"
            className="rounded-full text-white"
            disabled={saving}
            onClick={() => void onDelete()}
          >
            Delete
          </Button>
        )}
      </div>
    </form>
  );
}
