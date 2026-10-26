"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_FAQ_FILTERS,
  filterAndSortFaqs,
  uniqueAuthors,
  uniqueCategories,
  type FaqFilterState,
} from "@/features/faqs/faq-filters";
import { FaqList } from "@/features/faqs/faq-list";
import { FaqToolbar } from "@/features/faqs/faq-toolbar";
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
  const [filters, setFilters] = useState<FaqFilterState>(DEFAULT_FAQ_FILTERS);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      setExpandedId((current) =>
        current && next.some((row) => row.global.id === current) ? current : null,
      );
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

  useEffect(() => {
    setExpandedId(null);
    setFilters(DEFAULT_FAQ_FILTERS);
    setCreating(false);
  }, [selectedRegion?.id]);

  const categories = useMemo(() => uniqueCategories(rows), [rows]);
  const authors = useMemo(() => uniqueAuthors(rows), [rows]);
  const visibleRows = useMemo(
    () => filterAndSortFaqs(rows, filters),
    [rows, filters],
  );

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
    setExpandedId(null);
    await load();
  };

  const handleToggle = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">FAQs</h2>
          <p className="text-muted-foreground">
            Browse the catalog, then expand a row to edit global content or
            regional behavior for {selectedRegion.name}.
          </p>
        </div>
        {!creating && (
          <Button
            type="button"
            className="rounded-full text-white"
            onClick={() => {
              setCreating(true);
              setExpandedId(null);
            }}
          >
            Add global FAQ
          </Button>
        )}
      </div>

      {!selectedRegion.faqCollectionPath && (
        <Alert variant="warning">
          <AlertDescription>
            No Regional FAQ Collection is linked to this LocationItem yet.
            Global FAQs still appear; regional behavior saving needs a
            collection first.
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

      <FaqToolbar
        filters={filters}
        onChange={(next) => {
          setFilters(next);
          setExpandedId(null);
        }}
        categories={categories}
        authors={authors}
        resultCount={visibleRows.length}
        totalCount={rows.length}
      />

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
        </div>
      ) : (
        <FaqList
          rows={visibleRows}
          expandedId={expandedId}
          onToggle={handleToggle}
          onSaveRegional={handleSaveRegional}
          onUpdateGlobal={handleUpdateGlobal}
          onDeleteGlobal={handleDeleteGlobal}
        />
      )}
    </div>
  );
}
