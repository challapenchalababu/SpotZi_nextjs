import Image from "next/image";
import logo from "@/app/spotzi-logo.png";
import { cn } from "@/lib/cn";

export function BrandMark({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={logo}
      alt="SpotZi. Nearby Deals. Happier You."
      priority={priority}
      className={cn("block h-12 w-auto max-w-full object-contain sm:h-16 lg:h-20", className)}
    />
  );
}
