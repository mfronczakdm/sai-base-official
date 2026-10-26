"use client";

import { useCallback, useEffect, useState } from "react";
import { ServicesList } from "@/features/services/services-list";
import { useRegionContext } from "@/features/regions/region-context";
import { toMultilistValue } from "@/lib/sitecore/field-utils";
import type { RegionRatesSummary } from "@/types/content";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export default function ServicesPage() {
  const { selectedRegion, repository, connected } = useRegionContext();
  const [data, setData] = useState<RegionRatesSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!repository || !selectedRegion) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setData(await repository.getRegionRates(selectedRegion));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load services");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [repository, selectedRegion]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!connected) {
    return (
      <Alert variant="warning">
        <AlertDescription>
          Connect via Marketplace to manage LocationAdditionalService items for
          each region.
        </AlertDescription>
      </Alert>
    );
  }

  if (!selectedRegion) {
    return <p className="text-sm text-muted-foreground">Select a region.</p>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Services</h2>
        <p className="text-muted-foreground">
          Expand a row to edit additional services for {selectedRegion.name}.
          Section headers group the list on the public rates page.
        </p>
      </div>

      {error && (
        <Alert variant="danger">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading || !data ? (
        <div className="space-y-2">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
        </div>
      ) : (
        <ServicesList
          services={data.additionalServices}
          onCreate={async (values) => {
            if (!repository) return;
            await repository.createAdditionalService(selectedRegion, values);
            await load();
          }}
          onUpdate={async (id, values) => {
            if (!repository) return;
            await repository.updateAdditionalService(id, values);
            await load();
          }}
          onDelete={async (id) => {
            if (!repository) return;
            await repository.deleteItem(id, false);
            const remaining = data.additionalServices
              .filter((service) => service.id !== id)
              .map((service) => service.id);
            await repository.updateItemFields(selectedRegion.id, [
              {
                name: "AdditionalServices",
                value: toMultilistValue(remaining),
              },
            ]);
            await load();
          }}
        />
      )}
    </div>
  );
}
