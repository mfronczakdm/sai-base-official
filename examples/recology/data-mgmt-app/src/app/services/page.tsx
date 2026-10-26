"use client";

import { useEffect, useState } from "react";
import { useRegionContext } from "@/features/regions/region-context";
import type { AdditionalService, RegionRatesSummary } from "@/types/content";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export default function ServicesPage() {
  const { selectedRegion, repository, connected } = useRegionContext();
  const [data, setData] = useState<RegionRatesSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<
    Record<string, { serviceName: string; cost: string }>
  >({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!repository || !selectedRegion) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    repository
      .getRegionRates(selectedRegion)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setDrafts(
          Object.fromEntries(
            result.additionalServices.map((service) => [
              service.id,
              { serviceName: service.serviceName, cost: service.cost },
            ]),
          ),
        );
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load services");
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [repository, selectedRegion]);

  const saveService = async (service: AdditionalService) => {
    if (!repository) return;
    setSavingId(service.id);
    setError(null);
    try {
      const draft = drafts[service.id];
      await repository.updateItemFields(service.id, [
        { name: "ServiceName", value: draft?.serviceName ?? "" },
        { name: "Cost", value: draft?.cost ?? "" },
      ]);
      if (selectedRegion) {
        setData(await repository.getRegionRates(selectedRegion));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save service");
    } finally {
      setSavingId(null);
    }
  };

  if (!connected) {
    return (
      <Alert variant="warning">
        <AlertDescription>
          Connect via Marketplace to manage LocationAdditionalService items via
          the LocationItem AdditionalServices multilist.
        </AlertDescription>
      </Alert>
    );
  }

  if (!selectedRegion) {
    return <p className="text-sm text-muted-foreground">Select a region.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Services</h2>
        <p className="text-muted-foreground">
          Additional services for {selectedRegion.name} (ServiceName, Cost,
          IsSectionHeader on LocationAdditionalService).
        </p>
      </div>

      {error && (
        <Alert variant="danger">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading || !data ? (
        <Skeleton className="h-48" />
      ) : data.additionalServices.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No additional services configured for this location.
        </p>
      ) : (
        <div className="space-y-3">
          {data.additionalServices.map((service) =>
            service.isSectionHeader ? (
              <div key={service.id} className="pt-2">
                <Badge colorScheme="neutral" variant="bold">
                  {service.serviceName || service.name}
                </Badge>
              </div>
            ) : (
              <Card key={service.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{service.name}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-[1fr_160px_auto] md:items-end">
                  <div className="space-y-2">
                    <Label htmlFor={`name-${service.id}`}>Service name</Label>
                    <Input
                      id={`name-${service.id}`}
                      value={drafts[service.id]?.serviceName ?? ""}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [service.id]: {
                            serviceName: e.target.value,
                            cost: prev[service.id]?.cost ?? "",
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`cost-${service.id}`}>Cost</Label>
                    <Input
                      id={`cost-${service.id}`}
                      value={drafts[service.id]?.cost ?? ""}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [service.id]: {
                            serviceName: prev[service.id]?.serviceName ?? "",
                            cost: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <Button
                    disabled={savingId === service.id}
                    onClick={() => void saveService(service)}
                  >
                    {savingId === service.id ? "Saving..." : "Save"}
                  </Button>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      )}
    </div>
  );
}
