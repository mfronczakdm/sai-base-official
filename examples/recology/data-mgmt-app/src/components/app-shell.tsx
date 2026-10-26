"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RegionProvider, useRegionContext } from "@/features/regions/region-context";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/faqs", label: "FAQs" },
  { href: "/carts", label: "Carts & Pricing" },
  { href: "/services", label: "Services" },
] as const;

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    regions,
    selectedRegion,
    setSelectedRegionId,
    loading,
    error,
    connected,
  } = useRegionContext();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Sitecore Marketplace
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">
                Regional Content Manager
              </h1>
            </div>
            <Badge colorScheme={connected ? "success" : "warning"} variant="bold">
              {connected ? "Connected" : "Disconnected"}
            </Badge>
          </div>

          <div className="flex max-w-md flex-col gap-2">
            <Label htmlFor="region-select">Region / Service Area</Label>
            {loading ? (
              <Skeleton className="h-9 w-full" />
            ) : (
              <Select
                value={selectedRegion?.id || undefined}
                onValueChange={(value) => {
                  if (value) setSelectedRegionId(value);
                }}
                disabled={!regions.length}
              >
                <SelectTrigger id="region-select" className="w-full">
                  <SelectValue placeholder="Select a region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>

          <nav className="flex flex-wrap gap-1" aria-label="Primary">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <Separator />

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6">{children}</main>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <RegionProvider>
      <ShellInner>{children}</ShellInner>
    </RegionProvider>
  );
}
