import { cleanQuery, clientIp, jsonOk, parseSchema, withApi } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { findNearbyOffers } from "@/services/offer.service";
import { nearbyQuerySchema } from "@/validators";

export const GET = withApi(async (request) => {
  await rateLimit(`nearby:${clientIp(request)}`, 30, 60 * 1000);
  const query = parseSchema(nearbyQuerySchema, cleanQuery(request));
  return jsonOk(await findNearbyOffers(query));
});
