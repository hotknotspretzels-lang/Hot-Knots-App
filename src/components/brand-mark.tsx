import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandMark({
  size = "default",
  className,
}: {
  size?: "default" | "lg";
  className?: string;
}) {
  return (
    <span className={cn("font-heading flex items-center gap-2 text-foreground", className)}>
      <Image
        src="/icon-192.png"
        alt=""
        width={size === "lg" ? 40 : 28}
        height={size === "lg" ? 40 : 28}
        className="shrink-0"
      />
      <span className={size === "lg" ? "text-2xl" : "text-xl"}>Hot Knots</span>
    </span>
  );
}
