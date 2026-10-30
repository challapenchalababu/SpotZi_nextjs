"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { SiteEvent } from "@/lib/site-events";

const VISITOR_KEY = "spotzi_vid";

function visitorKey() {
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    const created = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `v_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(VISITOR_KEY, created);
    return created;
  } catch {
    return `session_${Date.now()}`;
  }
}

export function trackSiteEvent(event: SiteEvent) {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify({ event, visitorKey: visitorKey() });
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/analytics/track", blob);
      return;
    }
  } catch {
    // fall through to fetch
  }
  void fetch("/api/analytics/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);
}

/** Records one page view per mount (e.g. landing, offers, business login). */
export function TrackPageView({ event }: { event: SiteEvent }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    trackSiteEvent(event);
  }, [event]);
  return null;
}

export function TrackedLink({
  event,
  href,
  className,
  children,
  onClick,
  ...props
}: React.ComponentProps<typeof Link> & { event: SiteEvent }) {
  return (
    <Link
      {...props}
      href={href}
      className={className}
      onClick={(clickEvent) => {
        trackSiteEvent(event);
        onClick?.(clickEvent);
      }}
    >
      {children}
    </Link>
  );
}
