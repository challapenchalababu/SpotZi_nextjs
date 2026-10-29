const STORAGE_KEY = "loco-location";
const listeners = new Set<() => void>();

export type StoredLocation = { label: string; lat: number; lng: number; radiusKm: number };

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function readStored() {
  return sessionStorage.getItem(STORAGE_KEY) ?? "";
}

export function writeStored(value: StoredLocation | null) {
  if (value) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  else sessionStorage.removeItem(STORAGE_KEY);
  listeners.forEach((listener) => listener());
}

export function parseStored(raw: string): StoredLocation | null {
  if (!raw) return null;
  try {
    const stored = JSON.parse(raw) as StoredLocation;
    if (typeof stored.lat === "number" && typeof stored.lng === "number" && typeof stored.label === "string") return stored;
  } catch {
    return null;
  }
  return null;
}
