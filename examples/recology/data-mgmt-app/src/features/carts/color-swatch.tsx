import { cn } from "@/lib/utils";

export function cartColorStyle(color?: string): string {
  const value = (color || "").toLowerCase();
  if (value.includes("green")) return "bg-[#27a746]";
  if (value.includes("blue")) return "bg-[#0693e3]";
  if (value.includes("black") || value.includes("gray") || value.includes("grey")) {
    return "bg-[#444444]";
  }
  return "bg-[#d4d4d4]";
}

export function ColorSwatch({
  color,
  className,
}: {
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block size-3 shrink-0 rounded-full ring-1 ring-black/10",
        cartColorStyle(color),
        className,
      )}
      title={color || "Unknown"}
      aria-hidden="true"
    />
  );
}
