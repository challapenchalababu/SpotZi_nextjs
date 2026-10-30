"use client";

import { Suspense, useEffect, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { SpotZiLoaderOverlay } from "@/components/ui/spotzi-loader";
import { apiActivityCount, subscribeApiActivity } from "@/lib/api-client";
import { beginNavigation, endNavigation, navigationActivityCount, subscribeNavigationActivity } from "@/lib/navigation-activity";

function AppLoaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const apiPending = useSyncExternalStore(subscribeApiActivity, apiActivityCount, () => 0);
  const navPending = useSyncExternalStore(subscribeNavigationActivity, navigationActivityCount, () => 0);

  useEffect(() => {
    endNavigation();
  }, [pathname, searchParams]);

  useEffect(() => {
    if (navPending === 0) return;
    const timer = window.setTimeout(() => endNavigation(), 15000);
    return () => window.clearTimeout(timer);
  }, [navPending]);

  useEffect(() => {
    function onPointerUp(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = (event.target as Element | null)?.closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return;
      if (target.getAttribute("target") === "_blank" || target.hasAttribute("download")) return;
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash === "") return;
      beginNavigation();
    }

    function onSubmit(event: SubmitEvent) {
      const form = event.target as HTMLFormElement | null;
      if (!form || event.defaultPrevented) return;
      const method = (form.getAttribute("method") || "get").toLowerCase();
      if (method !== "get") return;
      beginNavigation();
    }

    document.addEventListener("click", onPointerUp, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      document.removeEventListener("click", onPointerUp, true);
      document.removeEventListener("submit", onSubmit, true);
    };
  }, []);

  if (apiPending === 0 && navPending === 0) return null;
  return <SpotZiLoaderOverlay />;
}

export function AppLoader() {
  return (
    <Suspense fallback={null}>
      <AppLoaderInner />
    </Suspense>
  );
}
