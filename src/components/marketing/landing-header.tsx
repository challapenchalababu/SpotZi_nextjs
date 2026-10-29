"use client";

import Link from "next/link";
import { useState } from "react";
import { MapPin, Menu, X } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

const links = [
  { href: "#how-it-works", label: "How It Works" },
  { href: "#categories", label: "Categories" },
  { href: "#for-businesses", label: "For Businesses" },
];

export function LandingHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-[#168747]/15 bg-[#F5FAF7]/95 backdrop-blur">
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-full bg-white px-3 py-2 text-[#103B3A]">Skip to content</a>
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        <Link href="/" className="flex shrink-0 items-center" aria-label="SpotZi home">
          <BrandMark priority />
        </Link>
        <nav className="ml-auto hidden items-center gap-1 text-sm text-[#103B3A] lg:flex" aria-label="Landing">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="rounded-full px-3 py-2 hover:bg-white">{link.label}</a>
          ))}
          <Link href="/owner/login" className="rounded-full px-3 py-2 font-semibold hover:bg-white">Business Login</Link>
          <Link href="/offers" className="ml-1 inline-flex items-center gap-2 rounded-full bg-[#FF6B32] px-4 py-2 font-semibold text-white hover:bg-[#e85d28]">
            <MapPin className="size-4" aria-hidden="true" />
            Find Offers
          </Link>
        </nav>
        <button className="ml-auto inline-flex size-10 shrink-0 items-center justify-center rounded-full text-[#103B3A] hover:bg-white lg:hidden" aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((value) => !value)}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open ? (
        <nav className="space-y-1 border-t border-[#168747]/15 px-4 py-3 text-sm lg:hidden" aria-label="Landing mobile">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="block rounded-xl px-3 py-2 text-[#103B3A] hover:bg-white" onClick={() => setOpen(false)}>{link.label}</a>
          ))}
          <Link href="/owner/login" className="block rounded-xl px-3 py-2 font-semibold text-[#168747]" onClick={() => setOpen(false)}>Business Login</Link>
          <Link href="/offers" className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#FF6B32] px-4 py-2 font-semibold text-white" onClick={() => setOpen(false)}>
            <MapPin className="size-4" aria-hidden="true" />
            Find Offers
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
