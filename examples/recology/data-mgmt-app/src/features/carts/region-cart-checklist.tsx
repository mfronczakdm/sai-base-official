"use client";

import { useEffect, useState } from "react";
import { ColorSwatch } from "@/features/carts/color-swatch";
import { normalizeGuid } from "@/lib/sitecore/field-utils";
import type { CartSize, CartType } from "@/types/content";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  regionName: string;
  cartTypes: CartType[];
  cartSizes: CartSize[];
  selectedTypeIds: string[];
  selectedSizeIds: string[];
  onSaveTypes: (ids: string[]) => Promise<void>;
  onSaveSizes: (ids: string[]) => Promise<void>;
};

export function RegionCartChecklist({
  regionName,
  cartTypes,
  cartSizes,
  selectedTypeIds,
  selectedSizeIds,
  onSaveTypes,
  onSaveSizes,
}: Props) {
  const [typeIds, setTypeIds] = useState(selectedTypeIds);
  const [sizeIds, setSizeIds] = useState(selectedSizeIds);
  const [savingTypes, setSavingTypes] = useState(false);
  const [savingSizes, setSavingSizes] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTypeIds(selectedTypeIds);
    setSizeIds(selectedSizeIds);
    setMessage(null);
    setError(null);
  }, [selectedTypeIds, selectedSizeIds]);

  const toggle = (ids: string[], id: string) => {
    const key = normalizeGuid(id);
    const exists = ids.some((value) => normalizeGuid(value) === key);
    return exists
      ? ids.filter((value) => normalizeGuid(value) !== key)
      : [...ids, id];
  };

  const isSelected = (ids: string[], id: string) =>
    ids.some((value) => normalizeGuid(value) === normalizeGuid(id));

  const saveTypes = async () => {
    setSavingTypes(true);
    setMessage(null);
    setError(null);
    try {
      await onSaveTypes(typeIds);
      setMessage("Saved applicable cart types for this region.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save cart types");
    } finally {
      setSavingTypes(false);
    }
  };

  const saveSizes = async () => {
    setSavingSizes(true);
    setMessage(null);
    setError(null);
    try {
      await onSaveSizes(sizeIds);
      setMessage("Saved applicable cart sizes for this region.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save cart sizes");
    } finally {
      setSavingSizes(false);
    }
  };

  return (
    <section className="space-y-4 rounded-xl border border-border bg-white p-4">
      <div>
        <h3 className="text-lg font-semibold">Applicable for {regionName}</h3>
        <p className="text-sm text-muted-foreground">
          Check which global cart types and sizes this region offers. Stored on
          the LocationItem CartTypes / CartSizes multilists.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChecklistGroup title="Cart types">
          {cartTypes.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">
              No global cart types available.
            </p>
          ) : (
            cartTypes.map((type) => (
              <ChecklistRow
                key={type.id}
                checked={isSelected(typeIds, type.id)}
                onChange={() => setTypeIds((prev) => toggle(prev, type.id))}
                label={
                  <span className="flex items-center gap-2">
                    <ColorSwatch color={type.color} />
                    <span>
                      <span className="block font-medium">{type.displayName}</span>
                      <span className="block text-xs text-muted-foreground">
                        {type.stream || type.color || "—"}
                      </span>
                    </span>
                  </span>
                }
              />
            ))
          )}
          <Button
            type="button"
            size="sm"
            className="mt-2 rounded-full text-white"
            disabled={savingTypes || cartTypes.length === 0}
            onClick={() => void saveTypes()}
          >
            {savingTypes ? "Saving..." : "Save cart types"}
          </Button>
        </ChecklistGroup>

        <ChecklistGroup title="Cart sizes">
          {cartSizes.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">
              No global cart sizes available.
            </p>
          ) : (
            cartSizes.map((size) => (
              <ChecklistRow
                key={size.id}
                checked={isSelected(sizeIds, size.id)}
                onChange={() => setSizeIds((prev) => toggle(prev, size.id))}
                label={
                  <span>
                    <span className="block font-medium">{size.displayName}</span>
                    <span className="block text-xs text-muted-foreground">
                      {size.dimensions ||
                        [size.capacity, size.unit].filter(Boolean).join(" ") ||
                        "—"}
                    </span>
                  </span>
                }
              />
            ))
          )}
          <Button
            type="button"
            size="sm"
            className="mt-2 rounded-full text-white"
            disabled={savingSizes || cartSizes.length === 0}
            onClick={() => void saveSizes()}
          >
            {savingSizes ? "Saving..." : "Save cart sizes"}
          </Button>
        </ChecklistGroup>
      </div>

      {message && <p className="text-sm text-[#1f8a38]">{message}</p>}
      {error && (
        <p className="text-sm text-[#444444]" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

function ChecklistGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h4>
      <div className="space-y-1 rounded-lg border border-border p-2">{children}</div>
    </div>
  );
}

function ChecklistRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 hover:bg-[#f3f7f4]",
        checked && "bg-[#e8f6ec]",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-1 size-4 accent-[#27a746]"
      />
      <span className="min-w-0 flex-1 text-sm">{label}</span>
    </label>
  );
}
