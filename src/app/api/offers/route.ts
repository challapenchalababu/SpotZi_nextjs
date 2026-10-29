import { cleanQuery, jsonOk, parseSchema, readJson, withApi } from "@/lib/http";
import { createOffers, listManagedOffers, listPublicOffers } from "@/services/offer.service";
import { getSession, requireRoles } from "@/lib/session";
import { createOfferSchema, listQuerySchema } from "@/validators";
import type { OfferType } from "@/types/domain";

export const GET = withApi(async (request) => {
  const query = parseSchema(listQuerySchema, cleanQuery(request));
  const session = await getSession();
  if (query.mine === "true") {
    const owner = await requireRoles(["owner"]);
    return jsonOk(await listManagedOffers({ page: query.page, limit: query.limit, ownerId: owner.id, q: query.q, status: query.status, category: query.category }));
  }
  if (session?.role === "super_admin" && query.includeInactive === "true") {
    return jsonOk(await listManagedOffers({ page: query.page, limit: query.limit, q: query.q, status: query.status, category: query.category }));
  }
  return jsonOk(
    await listPublicOffers({
      page: query.page,
      limit: Math.min(query.limit, 24),
      q: query.q,
      category: query.category,
      city: query.city,
      area: query.area,
      pincode: query.pincode,
      offerType: query.offerType as OfferType | undefined,
      discountMin: query.discountMin,
      sort: query.sort === "distance" ? "newest" : query.sort,
      currentlyAvailable: query.currentlyAvailable === "true",
    }),
  );
});

export const POST = withApi(async (request) => {
  const owner = await requireRoles(["owner"]);
  const input = parseSchema(createOfferSchema, await readJson(request));
  return jsonOk(await createOffers(owner.id, input), 201);
});
