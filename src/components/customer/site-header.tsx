"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, LogOut, Menu, Search, UserRound, X } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { buttonClass } from "@/components/ui/primitives";
import { api } from "@/lib/api-client";
import type { SessionUser } from "@/types/domain";

export function SiteHeader({ user }: { user: SessionUser | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [hiddenId, setHiddenId] = useState<string | null>(null);
  const current = user && hiddenId === user.id ? null : user;
  const account = current?.role === "owner" ? "/owner/dashboard" : current?.role === "super_admin" ? "/super-admin/dashboard" : "/profile";

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    if (user) setHiddenId(user.id);
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded bg-card px-3 py-2">Skip to content</a>
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        <Link href="/" className="shrink-0" aria-label="SpotZi home">
          <BrandMark priority />
        </Link>
        <form action="/search" className="hidden min-w-0 flex-1 items-center gap-2 lg:flex">
          <label className="sr-only" htmlFor="site-search">Search offers and businesses</label>
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-card px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input id="site-search" name="q" placeholder="Search offers or businesses" className="w-full bg-transparent py-2 text-sm outline-none" />
          </div>
          <button className={buttonClass("primary", "shrink-0")}>Search</button>
        </form>
        <nav className="ml-auto hidden items-center gap-1 text-sm lg:flex" aria-label="Primary">
          <Link className="rounded-full px-3 py-2 hover:bg-muted" href="/offers">Offers</Link>
          <Link className="rounded-full px-3 py-2 hover:bg-muted" href="/categories">Categories</Link>
          {current ? <AccountLinks user={current} account={account} onLogout={logout} /> : <GuestLinks />}
        </nav>
        <button className="ml-auto inline-flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-muted lg:hidden" aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((value) => !value)}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open ? (
        <div className="space-y-3 border-t border-border px-4 py-4 lg:hidden">
          <form action="/search" className="flex gap-2">
            <label className="sr-only" htmlFor="mobile-search">Search</label>
            <input id="mobile-search" name="q" className="w-full rounded-full border border-border bg-card px-3 py-2 text-sm" placeholder="Search offers" />
            <button className={buttonClass("primary")}>Search</button>
          </form>
          <div className="flex flex-col gap-1 text-sm">
            <Link className="rounded-xl px-3 py-2 hover:bg-muted" href="/offers" onClick={() => setOpen(false)}>Offers</Link>
            <Link className="rounded-xl px-3 py-2 hover:bg-muted" href="/categories" onClick={() => setOpen(false)}>Categories</Link>
            {current ? (
              <>
                {current.role === "customer" ? <Link className="rounded-xl px-3 py-2 hover:bg-muted" href="/favorites" onClick={() => setOpen(false)}>Saved offers</Link> : null}
                <Link className="rounded-xl px-3 py-2 hover:bg-muted" href={account} onClick={() => setOpen(false)}>Profile</Link>
                <button className="rounded-xl px-3 py-2 text-left hover:bg-muted" onClick={logout}>Log out</button>
              </>
            ) : (
              <>
                <Link className="rounded-xl px-3 py-2 hover:bg-muted" href="/login" onClick={() => setOpen(false)}>Log in</Link>
                <Link className="rounded-xl px-3 py-2 hover:bg-muted" href="/register" onClick={() => setOpen(false)}>Sign up</Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}

function GuestLinks() {
  return (
    <>
      <Link className="rounded-full px-3 py-2 hover:bg-muted" href="/login">Log in</Link>
      <Link className={buttonClass("primary")} href="/register">Sign up</Link>
    </>
  );
}

function AccountLinks({ user, account, onLogout }: { user: SessionUser; account: string; onLogout: () => void }) {
  return (
    <div className="ml-2 flex items-center gap-1 border-l border-border pl-2">
      {user.role === "customer" ? (
        <Link className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 hover:bg-muted" href="/favorites">
          <Heart className="size-4" aria-hidden="true" />
          Saved offers
        </Link>
      ) : null}
      <Link className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 hover:bg-muted" href={account}>
        <UserRound className="size-4" aria-hidden="true" />
        Profile
      </Link>
      <button className={buttonClass("secondary", "ml-1")} type="button" onClick={onLogout}>
        <LogOut className="size-4" aria-hidden="true" />
        Log out
      </button>
    </div>
  );
}
