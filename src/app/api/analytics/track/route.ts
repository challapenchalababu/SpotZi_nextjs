import { NextResponse } from "next/server";
import { clientIp, handleError, jsonOk, readJson } from "@/lib/http";
import { isSiteEvent } from "@/lib/site-events";
import { rateLimit } from "@/lib/rate-limit";
import { AppError } from "@/lib/errors";
import { trackSiteEvent } from "@/services/site-traffic.service";

/** Public anonymous beacon — no auth; origin check skipped so sendBeacon/keepalive works. */
export async function POST(request: Request) {
  try {
    await rateLimit(`site-track:${clientIp(request)}`, 120, 60 * 60 * 1000);
    const body = (await readJson(request)) as { event?: string; visitorKey?: string };
    if (!body.event || !isSiteEvent(body.event)) {
      throw new AppError(400, "invalid_event", "Unknown analytics event.");
    }
    if (!body.visitorKey || typeof body.visitorKey !== "string") {
      throw new AppError(400, "invalid_visitor", "Visitor key is required.");
    }
    await trackSiteEvent(body.event, body.visitorKey);
    return jsonOk({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
