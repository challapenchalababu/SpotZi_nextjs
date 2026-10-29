"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { LocateFixed } from "lucide-react";
import { OfferGrid } from "@/components/customer/offer-card";
import { parseStored, readStored, subscribe, writeStored, type StoredLocation } from "@/components/customer/location-store";
import { buttonClass, fieldClass, Notice } from "@/components/ui/primitives";
import { api } from "@/lib/api-client";
import type { PageResult, PublicOfferDTO } from "@/types/domain";

const RADII = [1, 5, 10, 25];

type PlaceHit = { label: string; lat: number; lng: number };

export function NearbyOffers({ defaultRadiusKm }: { defaultRadiusKm: number }) {
  const raw = useSyncExternalStore(subscribe, readStored, () => "");
  const location = useMemo(() => parseStored(raw), [raw]);
  const [message, setMessage] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [latText, setLatText] = useState("");
  const [lngText, setLngText] = useState("");
  const [places, setPlaces] = useState<PlaceHit[]>([]);
  const [searching, setSearching] = useState(false);
  const queryKey = location ? `${location.lat}|${location.lng}|${location.radiusKm}` : "";
  const [loaded, setLoaded] = useState<{ key: string; offers: PublicOfferDTO[]; error: boolean }>({ key: "", offers: [], error: false });

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
    api<PageResult<PublicOfferDTO>>(`/api/offers/nearby?${params}`)
      .then((result) => {
        if (!active) return;
        setLoaded({ key: queryKey, offers: result.items, error: false });
        setMessage(result.items.length === 0 ? "No published offers are open in this radius right now." : null);
        setDenied(false);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoaded({ key: queryKey, offers: [], error: true });
        setMessage(error instanceof Error ? error.message : "Could not load nearby offers.");
      });
    return () => {
      active = false;
    };
  }, [location, queryKey]);

  function saveLocation(next: Omit<StoredLocation, "radiusKm">) {
    writeStored({ ...next, radiusKm: location?.radiusKm || defaultRadiusKm });
    setPlaces([]);
    setMessage(null);
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setDenied(true);
      setMessage("This browser does not provide location. Enter a place or coordinates instead.");
      return;
    }
    setMessage("Location is used only to find offers near you for this visit. SpotZi does not keep tracking your position.");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        saveLocation({ label: "Current location", lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {
        setDenied(true);
        setMessage("Location permission was denied. Enter a city, area, or coordinates instead.");
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
    );
  }

  async function searchPlace() {
    const query = [area, city, pincode].map((part) => part.trim()).filter(Boolean).join(", ");
    const lat = Number(latText);
    const lng = Number(lngText);
    if (latText.trim() && lngText.trim()) {
      if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
        setMessage("Latitude must be between -90 and 90, and longitude between -180 and 180.");
        return;
      }
      saveLocation({ label: query || "Entered location", lat, lng });
      return;
    }
    if (query.length < 2) {
      setMessage("Enter a city, area, or pincode, or fill in latitude and longitude.");
      return;
    }
    setSearching(true);
    setMessage(null);
    try {
      const hits = await api<PlaceHit[]>(`/api/places?q=${encodeURIComponent(query)}`);
      setPlaces(hits);
      if (hits.length === 1) saveLocation(hits[0]);
      else if (hits.length === 0) setMessage("No matching place. Try a fuller address, or enter latitude and longitude.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not look up that place.");
    } finally {
      setSearching(false);
    }
  }

  const loading = Boolean(queryKey) && loaded.key !== queryKey;
  const offers = loaded.key === queryKey ? loaded.offers : [];
  const today = offers.filter((offer) => offer.availability === "active");
  const upcoming = offers.filter((offer) => offer.availability === "scheduled");

  return (
    <section className="space-y-6" aria-labelledby="nearby-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="nearby-heading" className="display text-3xl">Choose a location</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Today&apos;s offers and upcoming offers stay hidden until you use your current location or enter a place. Coordinates stay in this browser session and are not added to page links.
          </p>
        </div>
        <button className={buttonClass("primary", "w-full sm:w-auto")} type="button" onClick={useCurrentLocation}>
          <LocateFixed className="size-4" aria-hidden="true" />
          Use current location
        </button>
      </div>
      {message ? <Notice tone={loaded.error || denied ? "warning" : "info"}>{message}</Notice> : null}
      <form
        className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          void searchPlace();
        }}
      >
        <label className="text-sm">Area<input className={fieldClass} value={area} onChange={(event) => setArea(event.target.value)} placeholder="Indiranagar" /></label>
        <label className="text-sm">City<input className={fieldClass} value={city} onChange={(event) => setCity(event.target.value)} placeholder="Bengaluru" /></label>
        <label className="text-sm">Pincode<input className={fieldClass} value={pincode} onChange={(event) => setPincode(event.target.value)} placeholder="560038" /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">Latitude<input className={fieldClass} value={latText} onChange={(event) => setLatText(event.target.value)} inputMode="decimal" placeholder="12.97" /></label>
          <label className="text-sm">Longitude<input className={fieldClass} value={lngText} onChange={(event) => setLngText(event.target.value)} inputMode="decimal" placeholder="77.64" /></label>
        </div>
        <button className={buttonClass("secondary", "sm:col-span-2 sm:justify-self-start")} type="submit" disabled={searching}>
          {searching ? "Looking up…" : "Use this place"}
        </button>
      </form>
      {places.length > 1 ? (
        <ul className="space-y-2">
          {places.map((place) => (
            <li key={`${place.lat},${place.lng}`}>
              <button type="button" className="w-full rounded-xl border border-border bg-card px-4 py-3 text-left text-sm hover:border-primary" onClick={() => saveLocation(place)}>
                {place.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {location ? (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <p>Showing offers near <span className="font-semibold">{location.label}</span></p>
          <label>
            Radius
            <select
              className={`${fieldClass} ml-2 w-auto`}
              value={location.radiusKm}
              onChange={(event) => writeStored({ ...location, radiusKm: Number(event.target.value) })}
            >
              {RADII.map((radius) => <option key={radius} value={radius}>{radius} km</option>)}
            </select>
          </label>
          <button type="button" className={buttonClass("ghost")} onClick={() => { writeStored(null); setLoaded({ key: "", offers: [], error: false }); setMessage(null); }}>Change location</button>
        </div>
      ) : (
        <Notice>Select your current location or enter a place before the offers load.</Notice>
      )}
      {loading ? <div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-64 animate-pulse rounded-2xl bg-muted" />)}</div> : null}
      {location && !loading ? (
        <>
          <div className="space-y-4">
            <h3 className="display text-3xl">Today&apos;s offers</h3>
            {today.length ? <OfferGrid offers={today} /> : <p className="text-sm text-muted-foreground">No offers are valid today inside this radius.</p>}
          </div>
          <div className="space-y-4">
            <h3 className="display text-3xl">Upcoming offers</h3>
            {upcoming.length ? <OfferGrid offers={upcoming} /> : <p className="text-sm text-muted-foreground">No future offers are published inside this radius yet.</p>}
          </div>
        </>
      ) : null}
    </section>
  );
}
