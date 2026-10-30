"use client";

import Link from "next/link";
import { MapPin, Search, Store } from "lucide-react";
import { TrackedLink } from "@/components/analytics/site-tracker";

export function FindOffersCta({ className = "" }: { className?: string }) {
  return (
    <TrackedLink
      event="find_offers_click"
      href="/offers"
      className={`inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#FF6B32] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#e85d28] sm:w-auto ${className}`}
    >
      <Search className="size-4" aria-hidden="true" />
      Find Offers
    </TrackedLink>
  );
}

export function BusinessLoginCta({
  label,
  solid = false,
  className = "",
}: {
  label: string;
  solid?: boolean;
  className?: string;
}) {
  return (
    <Link
      href="/owner/login"
      className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition sm:w-auto ${solid ? "bg-[#168747] text-white hover:bg-[#12753d]" : "border border-[#168747] bg-white text-[#168747] hover:bg-[#168747]/10"} ${className}`}
    >
      <Store className="size-4" aria-hidden="true" />
      {label}
    </Link>
  );
}

export function HeaderFindOffersLink({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  return (
    <TrackedLink event="find_offers_click" href="/offers" className={className} onClick={onNavigate}>
      <MapPin className="size-4" aria-hidden="true" />
      Find Offers
    </TrackedLink>
  );
}
