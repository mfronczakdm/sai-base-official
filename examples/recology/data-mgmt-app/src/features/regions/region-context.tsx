"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  useAppContext,
  useMarketplaceClient,
  useMarketplaceState,
} from "@/components/providers/marketplace";
import { ContentRepository } from "@/lib/sitecore/content-repository";
import type { RegionOption } from "@/types/content";

type RegionContextValue = {
  regions: RegionOption[];
  selectedRegion: RegionOption | null;
  setSelectedRegionId: (id: string) => void;
  loading: boolean;
  error: string | null;
  repository: ContentRepository | null;
  refreshRegions: () => Promise<void>;
  connected: boolean;
};

const RegionContext = createContext<RegionContextValue | null>(null);

export function RegionProvider({ children }: { children: ReactNode }) {
  const client = useMarketplaceClient();
  const appContext = useAppContext();
  const { connectionError, connecting } = useMarketplaceState();
  const [regions, setRegions] = useState<RegionOption[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const repository = useMemo(() => {
    if (!client || !appContext) return null;
    return new ContentRepository(client, appContext);
  }, [client, appContext]);

  const connected = Boolean(repository) && !connectionError;

  const refreshRegions = useCallback(async () => {
    if (!repository) {
      setRegions([]);
      setError(
        connecting
          ? null
          : "Connect this app from Sitecore Marketplace to load live LocationItem regions.",
      );
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await repository.listRegions();
      setRegions(list);
      setSelectedRegionId((current) => current || list[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load regions");
      setRegions([]);
    } finally {
      setLoading(false);
    }
  }, [repository, connecting]);

  useEffect(() => {
    if (connecting) return;
    void refreshRegions();
  }, [refreshRegions, connecting]);

  const selectedRegion = regions.find((r) => r.id === selectedRegionId) || null;

  return (
    <RegionContext.Provider
      value={{
        regions,
        selectedRegion,
        setSelectedRegionId,
        loading,
        error,
        repository,
        refreshRegions,
        connected,
      }}
    >
      {children}
    </RegionContext.Provider>
  );
}

export function useRegionContext() {
  const ctx = useContext(RegionContext);
  if (!ctx) {
    throw new Error("useRegionContext must be used within RegionProvider");
  }
  return ctx;
}
