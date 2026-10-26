"use client";

import { useCallback, useEffect, useState } from "react";
import { CartRatesList } from "@/features/carts/cart-rates-list";
import { GlobalCatalogSection } from "@/features/carts/global-catalog-section";
import { RegionCartChecklist } from "@/features/carts/region-cart-checklist";
import { useRegionContext } from "@/features/regions/region-context";
import type { CartSizeInput, CartTypeInput } from "@/lib/sitecore/content-repository";
import { htmlToPlainText } from "@/lib/html-text";
import { toMultilistValue } from "@/lib/sitecore/field-utils";
import type { CartSize, CartType, RegionRatesSummary } from "@/types/content";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export default function CartsPage() {
  const { selectedRegion, repository, connected } = useRegionContext();
  const [data, setData] = useState<RegionRatesSummary | null>(null);
  const [cartTypes, setCartTypes] = useState<CartType[]>([]);
  const [cartSizes, setCartSizes] = useState<CartSize[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!repository || !selectedRegion) {
      setData(null);
      setCartTypes([]);
      setCartSizes([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [rates, types, sizes] = await Promise.all([
        repository.getRegionRates(selectedRegion),
        repository.listCartTypes(),
        repository.listCartSizes(),
      ]);
      setData(rates);
      setCartTypes(types);
      setCartSizes(sizes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load carts");
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
          Connect via Marketplace to manage global Cart Types / Cart Sizes and
          regional LocationItem CartRates.
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
          Author global cart types and sizes, choose what applies to{" "}
          {selectedRegion.name}, then manage regional rates.
        </p>
      </div>

      {error && (
        <Alert variant="danger">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading || !data ? (
        <div className="space-y-3">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      ) : (
        <>
          {(data.ratesHeading || data.ratesIntro) && (
            <div className="rounded-xl border border-border bg-white p-4">
              <h3 className="font-semibold">
                {data.ratesHeading || "Rates intro"}
              </h3>
              {data.ratesIntro && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                  {htmlToPlainText(data.ratesIntro)}
                </p>
              )}
            </div>
          )}

          <RegionCartChecklist
            regionName={selectedRegion.name}
            cartTypes={cartTypes}
            cartSizes={cartSizes}
            selectedTypeIds={data.selectedCartTypeIds}
            selectedSizeIds={data.selectedCartSizeIds}
            onSaveTypes={async (ids) => {
              if (!repository) return;
              await repository.setRegionCartTypes(selectedRegion.id, ids);
              await load();
            }}
            onSaveSizes={async (ids) => {
              if (!repository) return;
              await repository.setRegionCartSizes(selectedRegion.id, ids);
              await load();
            }}
          />

          <CartRatesList
            rates={data.cartRates}
            cartSizes={cartSizes}
            onCreate={async (values) => {
              if (!repository) return;
              await repository.createCartRate(selectedRegion, values);
              await load();
            }}
            onUpdate={async (id, values) => {
              if (!repository) return;
              await repository.updateCartRate(id, values);
              await load();
            }}
            onDelete={async (id) => {
              if (!repository) return;
              await repository.deleteItem(id, false);
              const remaining = data.cartRates
                .filter((rate) => rate.id !== id)
                .map((rate) => rate.id);
              await repository.updateItemFields(selectedRegion.id, [
                { name: "CartRates", value: toMultilistValue(remaining) },
              ]);
              await load();
            }}
          />

          <GlobalCatalogSection
            cartTypes={cartTypes}
            cartSizes={cartSizes}
            onCreateType={async (values: CartTypeInput) => {
              if (!repository) return;
              await repository.createCartType(values);
              await load();
            }}
            onUpdateType={async (id, values: CartTypeInput) => {
              if (!repository) return;
              await repository.updateCartType(id, values);
              await load();
            }}
            onDeleteType={async (id) => {
              if (!repository) return;
              await repository.deleteItem(id, false);
              await load();
            }}
            onCreateSize={async (values: CartSizeInput) => {
              if (!repository) return;
              await repository.createCartSize(values);
              await load();
            }}
            onUpdateSize={async (id, values: CartSizeInput) => {
              if (!repository) return;
              await repository.updateCartSize(id, values);
              await load();
            }}
            onDeleteSize={async (id) => {
              if (!repository) return;
              await repository.deleteItem(id, false);
              await load();
            }}
          />
        </>
      )}
    </div>
  );
}
