import { CURRENCY } from "@/lib/env";
import type { Address } from "@/types/domain";

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: CURRENCY,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function formatDate(value: string | Date, timeZone = "Asia/Kolkata") {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone }).format(new Date(value));
}

export function formatDateTime(value: string | Date, timeZone = "Asia/Kolkata") {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}

export function formatAddress(address: Address) {
  return [address.line1, address.line2, address.area, address.city, address.state, address.pincode]
    .filter(Boolean)
    .join(", ");
}

export function formatDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

export function directionsUrl(latitude: number, longitude: number, origin?: { lat: number; lng: number }) {
  const destination = `${latitude},${longitude}`;
  const from = origin ? `&origin=${origin.lat},${origin.lng}` : "";
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}${from}`;
}

export function truncate(value: string, length: number) {
  const trimmed = value.trim();
  if (trimmed.length <= length) return trimmed;
  return `${trimmed.slice(0, length - 1).trimEnd()}…`;
}

export function weekdayLabel(day: string) {
  return day.charAt(0).toUpperCase() + day.slice(1);
}
