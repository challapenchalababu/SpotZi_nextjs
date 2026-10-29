import { AppError } from "@/lib/errors";

const ABSOLUTE_MAX_RADIUS_KM = 100;

export function maxSearchRadiusKm() {
  const configured = Number(process.env.MAX_SEARCH_RADIUS_KM ?? 50);
  if (!Number.isFinite(configured) || configured <= 0) return 50;
  return Math.min(configured, ABSOLUTE_MAX_RADIUS_KM);
}

export function assertCoordinate(value: unknown, min: number, max: number) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new AppError(400, "invalid_coordinates", "Enter a valid latitude and longitude.");
  }
  return number;
}

export function assertRadiusKm(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new AppError(400, "invalid_radius", "Enter a search radius greater than 0.");
  }
  return Math.min(number, maxSearchRadiusKm());
}

export function validateNearbyQuery(input: { lat: unknown; lng: unknown; radiusKm: unknown }) {
  return {
    lat: assertCoordinate(input.lat, -90, 90),
    lng: assertCoordinate(input.lng, -180, 180),
    radiusKm: assertRadiusKm(input.radiusKm),
  };
}

export function toPoint(longitude: number, latitude: number) {
  return { type: "Point" as const, coordinates: [longitude, latitude] as [number, number] };
}
