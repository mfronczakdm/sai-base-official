"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ColorSwatch } from "@/features/carts/color-swatch";
import { CartTypeForm } from "@/features/carts/cart-type-form";
import { CartSizeForm } from "@/features/carts/cart-size-form";
import type { CartSizeInput, CartTypeInput } from "@/lib/sitecore/content-repository";
import type { CartSize, CartType } from "@/types/content";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CatalogProps = {
  cartTypes: CartType[];
  cartSizes: CartSize[];
  onCreateType: (values: CartTypeInput) => Promise<void>;
  onUpdateType: (id: string, values: CartTypeInput) => Promise<void>;
  onDeleteType: (id: string) => Promise<void>;
  onCreateSize: (values: CartSizeInput) => Promise<void>;
  onUpdateSize: (id: string, values: CartSizeInput) => Promise<void>;
  onDeleteSize: (id: string) => Promise<void>;
};

export function GlobalCatalogSection({
  cartTypes,
  cartSizes,
  onCreateType,
  onUpdateType,
  onDeleteType,
  onCreateSize,
  onUpdateSize,
  onDeleteSize,
}: CatalogProps) {
  const [typesOpen, setTypesOpen] = useState(true);
  const [sizesOpen, setSizesOpen] = useState(false);

  return (
    <div className="space-y-4">
      <CatalogPanel
        title="Global cart types"
        subtitle="Color streams (Green / Blue / Black or Gray) shared across regions"
        open={typesOpen}
        onToggle={() => setTypesOpen((v) => !v)}
        count={cartTypes.length}
      >
        <TypeCatalog
          items={cartTypes}
          onCreate={onCreateType}
          onUpdate={onUpdateType}
          onDelete={onDeleteType}
        />
      </CatalogPanel>

      <CatalogPanel
        title="Global cart sizes"
        subtitle="Size catalog (16 / 20 / 32 / 64 / 96-Gallon, Commercial Bin)"
        open={sizesOpen}
        onToggle={() => setSizesOpen((v) => !v)}
        count={cartSizes.length}
      >
        <SizeCatalog
          items={cartSizes}
          onCreate={onCreateSize}
          onUpdate={onUpdateSize}
          onDelete={onDeleteSize}
        />
      </CatalogPanel>
    </div>
  );
}

function CatalogPanel({
  title,
  subtitle,
  open,
  onToggle,
  count,
  children,
}: {
  title: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[#f3f7f4]"
        aria-expanded={open}
      >
        <span>
          <span className="flex items-center gap-2 font-semibold text-foreground">
            {open ? (
              <ChevronDown className="size-4 text-[#27a746]" />
            ) : (
              <ChevronRight className="size-4 text-[#27a746]" />
            )}
            {title}
          </span>
          <span className="mt-0.5 block pl-6 text-sm text-muted-foreground">
            {subtitle}
          </span>
        </span>
        <span className="rounded-full bg-[#e8f6ec] px-2.5 py-0.5 text-xs font-medium text-[#1f8a38]">
          {count}
        </span>
      </button>
      {open ? <div className="border-t border-border p-4">{children}</div> : null}
    </section>
  );
}

function TypeCatalog({
  items,
  onCreate,
  onUpdate,
  onDelete,
}: {
  items: CartType[];
  onCreate: (values: CartTypeInput) => Promise<void>;
  onUpdate: (id: string, values: CartTypeInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
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
            Add cart type
          </Button>
        )}
      </div>

      {creating && (
        <div className="rounded-lg border border-border bg-[#fbfcfb] p-4">
          <CartTypeForm
            submitLabel="Create cart type"
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
          {items.map((item) => {
            const open = expandedId === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-[#f3f7f4]",
                    open && "bg-[#e8f6ec]",
                  )}
                  onClick={() => {
                    setExpandedId(open ? null : item.id);
                    setEditing(false);
                  }}
                >
                  <ColorSwatch color={item.color} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {item.displayName}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {item.stream || item.color || "No stream set"}
                    </span>
                  </span>
                </button>
                {open ? (
                  <div className="space-y-3 border-t border-border bg-[#fbfcfb] p-4">
                    {!editing ? (
                      <>
                        <p className="whitespace-pre-wrap text-sm text-foreground">
                          {item.description || "No description"}
                        </p>
                        <dl className="grid gap-2 text-sm sm:grid-cols-3">
                          <Meta label="Color" value={item.color || "—"} />
                          <Meta label="Stream" value={item.stream || "—"} />
                          <Meta label="Code" value={item.code || "—"} />
                        </dl>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            className="rounded-full text-white"
                            onClick={() => setEditing(true)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="rounded-full text-white"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Delete cart type "${item.displayName}"?`,
                                )
                              ) {
                                void onDelete(item.id);
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </>
                    ) : (
                      <CartTypeForm
                        initial={item}
                        submitLabel="Update cart type"
                        onSubmit={async (values) => {
                          await onUpdate(item.id, values);
                          setEditing(false);
                        }}
                        onCancel={() => setEditing(false)}
                      />
                    )}
                  </div>
                ) : null}
              </li>
            );
          })}
          {!items.length && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              No cart types in Data/Cart Types yet.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function SizeCatalog({
  items,
  onCreate,
  onUpdate,
  onDelete,
}: {
  items: CartSize[];
  onCreate: (values: CartSizeInput) => Promise<void>;
  onUpdate: (id: string, values: CartSizeInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
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
            Add cart size
          </Button>
        )}
      </div>

      {creating && (
        <div className="rounded-lg border border-border bg-[#fbfcfb] p-4">
          <CartSizeForm
            submitLabel="Create cart size"
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
          {items.map((item) => {
            const open = expandedId === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-[#f3f7f4]",
                    open && "bg-[#e8f6ec]",
                  )}
                  onClick={() => {
                    setExpandedId(open ? null : item.id);
                    setEditing(false);
                  }}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {item.displayName}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {item.dimensions ||
                        [item.capacity, item.unit].filter(Boolean).join(" ") ||
                        "No dimensions"}
                    </span>
                  </span>
                </button>
                {open ? (
                  <div className="space-y-3 border-t border-border bg-[#fbfcfb] p-4">
                    {!editing ? (
                      <>
                        <p className="whitespace-pre-wrap text-sm">
                          {item.description || "No description"}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            className="rounded-full text-white"
                            onClick={() => setEditing(true)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="rounded-full text-white"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Delete cart size "${item.displayName}"?`,
                                )
                              ) {
                                void onDelete(item.id);
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </>
                    ) : (
                      <CartSizeForm
                        initial={item}
                        submitLabel="Update cart size"
                        onSubmit={async (values) => {
                          await onUpdate(item.id, values);
                          setEditing(false);
                        }}
                        onCancel={() => setEditing(false)}
                      />
                    )}
                  </div>
                ) : null}
              </li>
            );
          })}
          {!items.length && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              No cart sizes in Data/Cart Sizes yet.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white px-3 py-2 ring-1 ring-border">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  );
}
