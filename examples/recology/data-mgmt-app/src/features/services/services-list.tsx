"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { AdditionalService } from "@/types/content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ServiceDraft = {
  name: string;
  serviceName: string;
  cost: string;
  isSectionHeader: boolean;
};

type Props = {
  services: AdditionalService[];
  onCreate: (values: ServiceDraft) => Promise<void>;
  onUpdate: (id: string, values: ServiceDraft) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export function ServicesList({
  services,
  onCreate,
  onUpdate,
  onDelete,
}: Props) {
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        {!creating && (
          <Button
            type="button"
            className="rounded-full text-white"
            onClick={() => {
              setCreating(true);
              setExpandedId(null);
            }}
          >
            Add service
          </Button>
        )}
      </div>

      {creating && (
        <div className="rounded-xl border border-border bg-white p-4">
          <ServiceForm
            submitLabel="Create service"
            onSubmit={async (values) => {
              await onCreate(values);
              setCreating(false);
            }}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <ul className="divide-y divide-border">
          {services.map((service) => {
            const open = expandedId === service.id;
            return (
              <li key={service.id}>
                <button
                  type="button"
                  className={cn(
                    "grid w-full grid-cols-1 gap-1 px-4 py-3 text-left hover:bg-[#f3f7f4] sm:grid-cols-[1fr_140px_120px] sm:items-center",
                    open && "bg-[#e8f6ec]",
                  )}
                  onClick={() => setExpandedId(open ? null : service.id)}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {open ? (
                      <ChevronDown className="size-4 shrink-0 text-[#27a746]" />
                    ) : (
                      <ChevronRight className="size-4 shrink-0 text-[#27a746]" />
                    )}
                    <span className="truncate font-medium">
                      {service.serviceName || service.name}
                    </span>
                  </span>
                  <span className="pl-6 text-sm text-muted-foreground sm:pl-0">
                    {service.isSectionHeader ? "Section header" : "Service"}
                  </span>
                  <span className="pl-6 text-sm text-muted-foreground sm:pl-0">
                    {service.isSectionHeader ? "—" : service.cost || "—"}
                  </span>
                </button>
                {open ? (
                  <div className="border-t border-border bg-[#fbfcfb] px-4 py-4">
                    <ServiceForm
                      initial={service}
                      submitLabel="Update service"
                      onSubmit={async (values) => {
                        await onUpdate(service.id, values);
                      }}
                      onDelete={async () => {
                        if (
                          window.confirm(
                            `Delete "${service.serviceName || service.name}"?`,
                          )
                        ) {
                          await onDelete(service.id);
                          setExpandedId(null);
                        }
                      }}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
          {!services.length && (
            <li className="px-4 py-10 text-center text-sm text-muted-foreground">
              No additional services for this region yet.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function ServiceForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  onDelete,
}: {
  initial?: AdditionalService;
  submitLabel: string;
  onSubmit: (values: ServiceDraft) => Promise<void>;
  onCancel?: () => void;
  onDelete?: () => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [serviceName, setServiceName] = useState(initial?.serviceName || "");
  const [cost, setCost] = useState(initial?.cost || "");
  const [isSectionHeader, setIsSectionHeader] = useState(
    initial?.isSectionHeader || false,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(initial?.name || "");
    setServiceName(initial?.serviceName || "");
    setCost(initial?.cost || "");
    setIsSectionHeader(initial?.isSectionHeader || false);
    setError(null);
  }, [initial]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!serviceName.trim() && !name.trim()) {
      setError("Service name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim() || serviceName.trim(),
        serviceName: serviceName.trim() || name.trim(),
        cost: cost.trim(),
        isSectionHeader,
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
        {!initial && (
          <div className="space-y-2">
            <Label htmlFor="service-item-name">Item name</Label>
            <Input
              id="service-item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Cart Exchange"
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="service-display-name">Service name</Label>
          <Input
            id="service-display-name"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="service-cost">Cost</Label>
          <Input
            id="service-cost"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            disabled={isSectionHeader}
            placeholder="$49.59"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isSectionHeader}
          onChange={(e) => setIsSectionHeader(e.target.checked)}
          className="size-4 accent-[#27a746]"
        />
        Section header (no cost row)
      </label>
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
