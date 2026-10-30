"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { LocateFixed } from "lucide-react";
import { parseStored, readStored, subscribe, writeStored, type StoredLocation } from "@/components/customer/location-store";
import { StoreGrid } from "@/components/customer/store-card";
import { buttonClass, fieldClass, Notice } from "@/components/ui/primitives";
import { api } from "@/lib/api-client";
import type { PageResult, PublicStoreDTO } from "@/types/domain";

const RADII = [1, 5, 10, 25];

export function NearbyOffers({ defaultRadiusKm }: { defaultRadiusKm: number }) {
  const raw = useSyncExternalStore(subscribe, readStored, () => "");
  const location = useMemo(() => parseStored(raw), [raw]);
  const [message, setMessage] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);
  const queryKey = location ? `${location.lat}|${location.lng}|${location.radiusKm}` : "";
  const [loaded, setLoaded] = useState<{ key: string; stores: PublicStoreDTO[]; error: boolean }>({
    key: "",
    stores: [],
    error: false,
  });

  useEffect(() => {
    if (!location || !queryKey) return;
    let active = true;
    const params = new URLSearchParams({
      lat: String(location.lat),
      lng: String(location.lng),
      radiusKm: String(location.radiusKm),
      sort: "distance",
      limit: "24",
    });
    api<PageResult<PublicStoreDTO>>(`/api/stores/nearby?${params}`)
      .then((result) => {
        if (!active) return;
        setLoaded({ key: queryKey, stores: result.items, error: false });
        setMessage(result.items.length === 0 ? "No stores with live offers are open in this radius right now." : null);
        setDenied(false);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoaded({ key: queryKey, stores: [], error: true });
        setMessage(error instanceof Error ? error.message : "Could not load nearby stores.");
      });
    return () => {
      active = false;
    };
  }, [location, queryKey]);

  function saveLocation(next: Omit<StoredLocation, "radiusKm">) {
    writeStored({ ...next, radiusKm: location?.radiusKm || defaultRadiusKm });
    setMessage(null);
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setDenied(true);
      setMessage("This browser does not provide location. Allow location access in another browser, or try again.");
      return;
    }
    setMessage("Location is used only to find stores near you for this visit. SpotZi does not keep tracking your position.");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        saveLocation({ label: "Current location", lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {
        setDenied(true);
        setMessage("Location permission was denied. Allow location access for this site, then try again.");
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
    );
  }

  const loading = Boolean(queryKey) && loaded.key !== queryKey;
  const stores = loaded.key === queryKey ? loaded.stores : [];

  return (
    <section className="space-y-6" aria-labelledby="nearby-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="nearby-heading" className="display text-3xl">Nearby stores</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Use your current location to see nearby branches with offers. Open a store to view its products and claim one redemption code for that branch offer.
          </p>
        </div>
        <button className={buttonClass("primary", "w-full sm:w-auto")} type="button" onClick={useCurrentLocation}>
          <LocateFixed className="size-4" aria-hidden="true" />
          Use current location
        </button>
      </div>
      {message ? <Notice tone={loaded.error || denied ? "warning" : "info"}>{message}</Notice> : null}
      {location ? (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <p>
            Showing stores near <span className="font-semibold">{location.label}</span>
          </p>
          <label>
            Radius
            <select
              className={`${fieldClass} ml-2 w-auto`}
              value={location.radiusKm}
              onChange={(event) => writeStored({ ...location, radiusKm: Number(event.target.value) })}
            >
              {RADII.map((radius) => (
                <option key={radius} value={radius}>
                  {radius} km
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className={buttonClass("ghost")}
            onClick={() => {
              writeStored(null);
              setLoaded({ key: "", stores: [], error: false });
              setMessage(null);
            }}
          >
            Clear location
          </button>
        </div>
      ) : (
        <Notice>Use your current location before nearby stores load.</Notice>
      )}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-64 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : null}
      {location && !loading ? (
        stores.length ? <StoreGrid stores={stores} /> : <p className="text-sm text-muted-foreground">No stores with offers were found in this radius.</p>
      ) : null}
    </section>
  );
}
