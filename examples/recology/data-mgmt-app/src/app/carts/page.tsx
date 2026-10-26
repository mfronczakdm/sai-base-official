"use client";

import { useEffect, useState } from "react";
import { useRegionContext } from "@/features/regions/region-context";
import type { RegionRatesSummary } from "@/types/content";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CartsPage() {
  const { selectedRegion, repository, connected } = useRegionContext();
  const [data, setData] = useState<RegionRatesSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftRates, setDraftRates] = useState<Record<string, string>>({});
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
        setDraftRates(
          Object.fromEntries(result.cartRates.map((r) => [r.id, r.monthlyRate])),
        );
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load carts");
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

  const saveRate = async (cartId: string) => {
    if (!repository) return;
    setSavingId(cartId);
    setError(null);
    try {
      await repository.updateItemFields(cartId, [
        { name: "MonthlyRate", value: draftRates[cartId] ?? "" },
      ]);
      const refreshed = selectedRegion
        ? await repository.getRegionRates(selectedRegion)
        : null;
      setData(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save rate");
    } finally {
      setSavingId(null);
    }
  };

  if (!connected) {
    return (
      <Alert variant="warning">
        <AlertDescription>
          Connect via Marketplace to manage LocationItem CartRates /
          LocationCartRate fields from the Recology tree.
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
        <h2 className="text-2xl font-semibold tracking-tight">Carts &amp; Pricing</h2>
        <p className="text-muted-foreground">
          Cart configurations for {selectedRegion.name} from LocationItem
          CartRates (LocationCartRate: MonthlyRate, Dimensions,
          TypicalWeeklyNeeds).
        </p>
      </div>

      {error && (
        <Alert variant="danger">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading || !data ? (
        <Skeleton className="h-48" />
      ) : (
        <>
          {(data.ratesHeading || data.ratesIntro) && (
            <Card>
              <CardHeader>
                <CardTitle>{data.ratesHeading || "Rates"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm max-w-none text-sm"
                  dangerouslySetInnerHTML={{ __html: data.ratesIntro || "" }}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Cart rates</CardTitle>
            </CardHeader>
            <CardContent>
              {data.cartRates.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No cart rates configured for this location.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cart</TableHead>
                      <TableHead>Monthly rate</TableHead>
                      <TableHead>Dimensions</TableHead>
                      <TableHead>Typical weekly needs</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.cartRates.map((cart) => (
                      <TableRow key={cart.id}>
                        <TableCell className="font-medium">{cart.name}</TableCell>
                        <TableCell>
                          <Label className="sr-only" htmlFor={`rate-${cart.id}`}>
                            Monthly rate
                          </Label>
                          <Input
                            id={`rate-${cart.id}`}
                            value={draftRates[cart.id] ?? ""}
                            onChange={(e) =>
                              setDraftRates((prev) => ({
                                ...prev,
                                [cart.id]: e.target.value,
                              }))
                            }
                            className="w-28"
                          />
                        </TableCell>
                        <TableCell>{cart.dimensions || "—"}</TableCell>
                        <TableCell>{cart.typicalWeeklyNeeds || "—"}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            disabled={savingId === cart.id}
                            onClick={() => void saveRate(cart.id)}
                          >
                            {savingId === cart.id ? "Saving..." : "Save"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
