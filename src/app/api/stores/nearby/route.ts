import { jsonOk, parseSchema, queryObject, withApi } from "@/lib/http";
import { findNearbyStores } from "@/services/offer.service";
import { nearbyQuerySchema } from "@/validators";

export const GET = withApi(async (request) => {
  const query = parseSchema(nearbyQuerySchema, queryObject(request));
  return jsonOk(await findNearbyStores(query));
});
