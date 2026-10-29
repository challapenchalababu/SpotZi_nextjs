"use client";

import { useSyncExternalStore } from "react";
import { apiActivityCount, subscribeApiActivity } from "@/lib/api-client";

export function ApiLoader() {
  const pending = useSyncExternalStore(subscribeApiActivity, apiActivityCount, () => 0);
  if (pending === 0) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/55" role="status" aria-live="polite" aria-busy="true">
      <div className="flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3 shadow-lg">
        <span className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
        <span className="text-sm font-semibold">Loading</span>
      </div>
    </div>
  );
}
