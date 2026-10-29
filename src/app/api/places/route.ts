import { AppError } from "@/lib/errors";
import { clientIp, jsonOk, withApi } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

type NominatimRow = { display_name?: string; lat?: string; lon?: string };

export const GET = withApi(async (request) => {
  await rateLimit(`places:${clientIp(request)}`, 20, 60 * 1000);
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 160) {
    throw new AppError(400, "invalid_place", "Enter a city, area, or address.");
  }
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "5");
  url.searchParams.set("q", query);
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "SpotZi/1.0 (local offers lookup)" },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new AppError(503, "place_lookup_failed", "Place search is unavailable. Enter latitude and longitude instead.");
  }
  const rows = (await response.json()) as NominatimRow[];
  const places = rows.flatMap((row) => {
    const lat = Number(row.lat);
    const lng = Number(row.lon);
    if (!row.display_name || !Number.isFinite(lat) || !Number.isFinite(lng)) return [];
    return [{ label: row.display_name, lat, lng }];
  });
  return jsonOk(places);
});
