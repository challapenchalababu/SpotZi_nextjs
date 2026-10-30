"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  BadgePercent,
  Building,
  ChartColumn,
  Flag,
  Images,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Menu,
  ScrollText,
  Settings,
  Store,
  Ticket,
  Users,
  X,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import type { SessionUser } from "@/types/domain";

const icons = {
  dashboard: LayoutDashboard,
  businesses: Store,
  branches: MapPinned,
  templates: Images,
  offers: BadgePercent,
  redemptions: Ticket,
  reports: Flag,
  analytics: ChartColumn,
  users: Users,
  activity: ScrollText,
  settings: Settings,
  building: Building,
};

export function DashboardShell({
  area,
  user,
  preview = false,
  children,
}: {
  area: "owner" | "super_admin";
  user: SessionUser;
  preview?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = area === "owner" ? ownerNav : adminNav;
  const home = area === "owner" ? "/owner/dashboard" : "/super-admin/dashboard";

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    window.location.href = area === "owner" ? "/owner/login" : "/super-admin/login";
  }

  return (
    <div className="min-h-screen bg-background md:grid md:grid-cols-[240px_1fr]">
      <aside className={cn("border-b border-border bg-card text-foreground md:min-h-screen md:border-b-0 md:border-r", open ? "block" : "hidden md:block")}>
        <div className="flex items-center justify-between px-4 py-4">
          <Link href={home} aria-label="SpotZi home" className="min-w-0"><BrandMark className="lg:h-16" /></Link>
          <button className="md:hidden" aria-label="Close menu" onClick={() => setOpen(false)}><X className="size-5" stroke="url(#spotzi-icon)" /></button>
        </div>
        <p className="text-spot-gradient px-4 pb-3 text-xs font-semibold uppercase tracking-wide">{area === "owner" ? "Business" : "Super admin"}</p>
        <nav className="space-y-1 px-2 pb-6" aria-label="Dashboard">
          {items.map((item) => {
            const Icon = icons[item.icon];
            const active = pathname === item.href || (item.href !== home && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={cn("flex items-center gap-2 rounded-xl px-3 py-2 text-sm", active ? "bg-muted font-semibold" : "hover:bg-muted")}>
                <Icon className="size-4 shrink-0" aria-hidden="true" stroke="url(#spotzi-icon)" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div>
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <button className="md:hidden" aria-label="Open menu" onClick={() => setOpen(true)}><Menu className="size-5" /></button>
          <p className="text-sm">{user.name}</p>
          <button className="inline-flex items-center gap-2 text-sm" onClick={logout}><LogOut className="size-4" aria-hidden="true" />Log out</button>
        </header>
        {preview ? <p className="bg-[#f4c95d] px-4 py-2 text-center text-sm text-[#142421]">Sample data from src/data/preview.json. Connect MongoDB before saving changes.</p> : null}
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">{children}</div>
      </div>
    </div>
  );
}

const ownerNav: Array<{ href: string; label: string; icon: keyof typeof icons }> = [
  { href: "/owner/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/owner/businesses", label: "Businesses", icon: "businesses" },
  { href: "/owner/branches", label: "Branches", icon: "branches" },
  { href: "/owner/templates", label: "Templates", icon: "templates" },
  { href: "/owner/offers", label: "Today's offers", icon: "offers" },
  { href: "/owner/redemptions", label: "Redemptions", icon: "redemptions" },
  { href: "/owner/reports", label: "Reports", icon: "reports" },
  { href: "/owner/analytics", label: "Analytics", icon: "analytics" },
  { href: "/owner/favorites", label: "Saves", icon: "offers" },
  { href: "/owner/profile", label: "Profile", icon: "users" },
  { href: "/owner/settings", label: "Settings", icon: "settings" },
];

const adminNav: Array<{ href: string; label: string; icon: keyof typeof icons }> = [
  { href: "/super-admin/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/super-admin/users", label: "Users", icon: "users" },
  { href: "/super-admin/customers", label: "Customers", icon: "users" },
  { href: "/super-admin/owners", label: "Owners", icon: "building" },
  { href: "/super-admin/businesses", label: "Businesses", icon: "businesses" },
  { href: "/super-admin/branches", label: "Branches", icon: "branches" },
  { href: "/super-admin/offers", label: "Offers", icon: "offers" },
  { href: "/super-admin/categories", label: "Categories", icon: "templates" },
  { href: "/super-admin/templates", label: "Templates", icon: "templates" },
  { href: "/super-admin/reports", label: "Reports", icon: "reports" },
  { href: "/super-admin/activity-logs", label: "Activity", icon: "activity" },
  { href: "/super-admin/traffic", label: "Site traffic", icon: "analytics" },
  { href: "/super-admin/revenue", label: "Revenue", icon: "analytics" },
  { href: "/super-admin/subscriptions", label: "Subscriptions", icon: "analytics" },
  { href: "/super-admin/profile", label: "Profile", icon: "users" },
  { href: "/super-admin/settings", label: "Settings", icon: "settings" },
];
