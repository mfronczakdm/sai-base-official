import { Badge } from "@/components/ui/badge";
import type { BehaviorBadge } from "@/types/content";
import { cn } from "@/lib/utils";

const STYLES: Record<BehaviorBadge, string> = {
  GLOBAL: "bg-slate-100 text-slate-800",
  INHERITED: "bg-emerald-100 text-emerald-800",
  EXTENDED: "bg-sky-100 text-sky-800",
  OVERRIDDEN: "bg-amber-100 text-amber-900",
  EXCLUDED: "bg-rose-100 text-rose-800",
};

export function BehaviorStatusBadge({
  badge,
  className,
}: {
  badge: BehaviorBadge;
  className?: string;
}) {
  return (
    <Badge variant="bold" colorScheme="neutral" className={cn(STYLES[badge], className)}>
      {badge}
    </Badge>
  );
}
