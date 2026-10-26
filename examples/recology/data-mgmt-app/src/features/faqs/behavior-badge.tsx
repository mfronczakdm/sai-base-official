import { Badge } from "@/components/ui/badge";
import type { BehaviorBadge } from "@/types/content";
import { cn } from "@/lib/utils";

/** Recology palette only: green / blue / gray / white */
const STYLES: Record<BehaviorBadge, string> = {
  GLOBAL: "bg-[#f5f5f5] text-[#444444]",
  INHERITED: "bg-[#e8f6ec] text-[#1f8a38]",
  EXTENDED: "bg-[#e6f4fc] text-[#0576b6]",
  OVERRIDDEN: "bg-[#e6f4fc] text-[#444444]",
  EXCLUDED: "bg-[#f5f5f5] text-[#6b6b6b]",
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
