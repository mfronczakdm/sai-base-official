"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRegionContext } from "@/features/regions/region-context";
import type { RegionOverviewStats } from "@/types/content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function OverviewPage() {
  const { selectedRegion, repository, connected } = useRegionContext();
  const [stats, setStats] = useState<RegionOverviewStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!repository || !selectedRegion) {
      setStats(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    repository
      .getOverviewStats(selectedRegion)
      .then((result) => {
        if (!cancelled) setStats(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load overview");
          setStats(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [repository, selectedRegion]);

  if (!connected) {
    return (
      <Alert variant="warning">
        <AlertDescription>
          Open Regional Content Manager from Sitecore Marketplace to load live
          LocationItem, FAQ, cart, and service content. This app does not use a
          local content repository.
        </AlertDescription>
      </Alert>
    );
  }

  if (!selectedRegion) {
    return <p className="text-sm text-muted-foreground">Select a region to begin.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">{selectedRegion.name}</h2>
        <p className="mt-1 text-muted-foreground">
          What content and configuration exists for this region?
        </p>
      </div>

      {error && (
        <Alert variant="danger">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading || !stats ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>
                <Link href="/faqs" className="hover:underline">
                  FAQ Content
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>{stats.faqs.inherited} inherited</p>
              <p>{stats.faqs.extended} extended</p>
              <p>{stats.faqs.overridden} overridden</p>
              <p>{stats.faqs.excluded} excluded</p>
              <p className="text-muted-foreground">
                {stats.faqs.unconfigured} global-only (no regional config)
              </p>
              <p className="pt-2 font-medium">
                {stats.faqs.totalGlobal} global FAQs total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <Link href="/carts" className="hover:underline">
                  Cart Configuration
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="text-2xl font-semibold">
                {stats.carts.cartTypesConfigured}
              </p>
              <p className="text-muted-foreground">cart types configured</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <Link href="/services" className="hover:underline">
                  Services
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="text-2xl font-semibold">
                {stats.services.servicesConfigured}
              </p>
              <p className="text-muted-foreground">services configured</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
