"use client";

import {
  type ApplicationContext,
  ClientSDK,
} from "@sitecore-marketplace-sdk/client";
import { XMC } from "@sitecore-marketplace-sdk/xmc";
import type React from "react";
import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface ClientSDKProviderProps {
  children: ReactNode;
}

type MarketplaceState = {
  client: ClientSDK | null;
  appContext: ApplicationContext | null;
  connecting: boolean;
  connectionError: string | null;
};

const ClientSDKContext = createContext<ClientSDK | null>(null);
const AppContextContext = createContext<ApplicationContext | null>(null);
const MarketplaceStateContext = createContext<MarketplaceState>({
  client: null,
  appContext: null,
  connecting: true,
  connectionError: null,
});

export const MarketplaceProvider: React.FC<ClientSDKProviderProps> = ({
  children,
}) => {
  const [client, setClient] = useState<ClientSDK | null>(null);
  const [appContext, setAppContext] = useState<ApplicationContext | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(true);

  useEffect(() => {
    if (!client) return;
    client
      .query("application.context")
      .then((res) => {
        if (res?.data) {
          setAppContext(res.data);
        }
      })
      .catch((err) => {
        setConnectionError(
          err instanceof Error ? err.message : "Failed to load application context",
        );
      });
  }, [client]);

  useEffect(() => {
    const init = async () => {
      try {
        setConnecting(true);
        setConnectionError(null);
        const nextClient = await ClientSDK.init({
          target: window.parent,
          modules: [XMC],
        });
        setClient(nextClient);
      } catch (error) {
        console.error("Error initializing client SDK", error);
        setClient(null);
        setAppContext(null);
        setConnectionError(
          "Marketplace SDK could not connect. Open this app from SitecoreAI Marketplace (iframe host) with SitecoreAI API access enabled.",
        );
      } finally {
        setConnecting(false);
      }
    };

    void init();
  }, []);

  const state: MarketplaceState = {
    client,
    appContext,
    connecting,
    connectionError,
  };

  return (
    <MarketplaceStateContext.Provider value={state}>
      <ClientSDKContext.Provider value={client}>
        <AppContextContext.Provider value={appContext}>
          {connecting ? (
            <div className="flex min-h-screen flex-col gap-3 p-8">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
              <p className="text-sm text-muted-foreground">
                Attempting to connect to Sitecore Marketplace...
              </p>
            </div>
          ) : (
            <>
              {connectionError && (
                <div className="border-b bg-background p-4">
                  <Alert variant="danger">
                    <AlertTitle>Not connected to Sitecore Marketplace</AlertTitle>
                    <AlertDescription>{connectionError}</AlertDescription>
                  </Alert>
                </div>
              )}
              {children}
            </>
          )}
        </AppContextContext.Provider>
      </ClientSDKContext.Provider>
    </MarketplaceStateContext.Provider>
  );
};

export const useMarketplaceState = () => useContext(MarketplaceStateContext);

export const useMarketplaceClient = () => {
  return useContext(ClientSDKContext);
};

export const useAppContext = () => {
  return useContext(AppContextContext);
};
