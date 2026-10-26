"use client";

import { useCallback, useEffect, useState } from "react";
import { FaqEditorCard } from "@/features/faqs/faq-editor-card";
import {
  GlobalFaqForm,
  type GlobalFaqFormValues,
} from "@/features/faqs/global-faq-form";
import { useRegionContext } from "@/features/regions/region-context";
import type { FaqRow, RegionalFaqBehavior } from "@/types/content";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function FaqsPage() {
  const { selectedRegion, repository, connected } = useRegionContext();
  const [rows, setRows] = useState<FaqRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    if (!repository || !selectedRegion) {
      setRows([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await repository.getFaqRowsForRegion(selectedRegion);
      setRows(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load FAQs");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [repository, selectedRegion]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSaveRegional = async (input: {
    configId?: string;
    behavior: RegionalFaqBehavior;
    regionalSupportingInformation: string;
    regionalAnswer: string;
  }) => {
    if (!repository) throw new Error("Not connected");
    if (!input.configId) {
      throw new Error(
        "No Regional FAQ Configuration item for this FAQ. Create one under the region's Regional FAQ Collection first.",
      );
    }
    await repository.updateItemFields(input.configId, [
      { name: "Behavior", value: input.behavior },
      {
        name: "RegionalSupportingInformation",
        value: input.regionalSupportingInformation,
      },
      { name: "RegionalAnswer", value: input.regionalAnswer },
    ]);
    await load();
  };

  const handleCreateGlobal = async (values: GlobalFaqFormValues) => {
    if (!repository) throw new Error("Not connected");
    await repository.createGlobalFaq(values);
    setCreating(false);
    await load();
  };

  const handleUpdateGlobal = async (id: string, values: GlobalFaqFormValues) => {
    if (!repository) throw new Error("Not connected");
    await repository.updateGlobalFaq(id, values);
    await load();
  };

  const handleDeleteGlobal = async (id: string) => {
    if (!repository) throw new Error("Not connected");
    await repository.deleteItem(id, false);
    await load();
  };

  if (!connected) {
    return (
      <Alert variant="warning">
        <AlertDescription>
          Connect via Sitecore Marketplace to manage Global FAQ + Regional FAQ
          Configuration items from the Recology content tree.
        </AlertDescription>
      </Alert>
    );
  }

  if (!selectedRegion) {
    return <p className="text-sm text-muted-foreground">Select a region.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">FAQs</h2>
          <p className="text-muted-foreground">
            Edit global Q&amp;A once, then configure regional behavior for{" "}
            {selectedRegion.name}.
          </p>
        </div>
        {!creating && (
          <Button type="button" onClick={() => setCreating(true)}>
            Add global FAQ
          </Button>
        )}
      </div>

      {!selectedRegion.faqCollectionPath && (
        <Alert variant="warning">
          <AlertDescription>
            No Regional FAQ Collection is linked to this LocationItem yet
            (Region field / name match). FAQ rows still list global items;
            regional configs will appear once a collection is associated.
          </AlertDescription>
        </Alert>
      )}

      {creating && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">New global FAQ</CardTitle>
          </CardHeader>
          <CardContent>
            <GlobalFaqForm
              submitLabel="Create global FAQ"
              onSubmit={handleCreateGlobal}
              onCancel={() => setCreating(false)}
            />
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="danger">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <FaqEditorCard
              key={row.global.id}
              row={row}
              onSaveRegional={handleSaveRegional}
              onUpdateGlobal={handleUpdateGlobal}
              onDeleteGlobal={handleDeleteGlobal}
            />
          ))}
          {!rows.length && (
            <p className="text-sm text-muted-foreground">
              No Global FAQ items found under Data/Global FAQs.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
