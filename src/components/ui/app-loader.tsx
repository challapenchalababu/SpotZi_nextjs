"use client";

import { Suspense, useEffect, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { apiActivityCount, subscribeApiActivity } from "@/lib/api-client";
import { beginNavigation, endNavigation, navigationActivityCount, subscribeNavigationActivity } from "@/lib/navigation-activity";

function LoaderOverlay() {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#c1c8c8]/45 backdrop-blur-[1px]" role="status" aria-live="polite" aria-busy="true">
      <picture>
        <source srcSet="/logo_loader.webp" type="image/webp" />
        <img
          src="/logo_loader.gif"
          alt="Loading SpotZi"
          width={400}
          height={225}
          className="h-64 w-auto max-w-[min(94vw,40rem)] bg-transparent object-contain sm:h-72 md:h-80"
        />
      </picture>
      <span className="sr-only">Loading</span>
    </div>
  );
}

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
  return <LoaderOverlay />;
}

export function AppLoader() {
  return (
    <Suspense fallback={null}>
      <AppLoaderInner />
    </Suspense>
  );
}
