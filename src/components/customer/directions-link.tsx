"use client";

import { useSyncExternalStore } from "react";
import { directionsUrl } from "@/lib/format";
import { parseStored, readStored, subscribe } from "@/components/customer/location-store";

export function DirectionsLink({ latitude, longitude }: { latitude: number; longitude: number }) {
  const raw = useSyncExternalStore(subscribe, readStored, () => "");
  const location = parseStored(raw);
  const href = directionsUrl(latitude, longitude, location ? { lat: location.lat, lng: location.lng } : undefined);
  return (
    <a className="text-sm font-semibold text-primary" href={href} target="_blank" rel="noreferrer">
      Directions
    </a>
  );
}
