import { cleanQuery, jsonOk, parseSchema, readJson, withApi } from "@/lib/http";
import {
  createBusiness,
  listAdminBusinesses,
  listOwnerBusinesses,
  listPublicBusinesses,
} from "@/services/business.service";
import { getSession, requireRoles } from "@/lib/session";
import { businessSchema, listQuerySchema } from "@/validators";

export const GET = withApi(async (request) => {
  const query = parseSchema(listQuerySchema, cleanQuery(request));
  const session = await getSession();
  if (query.mine === "true") {
    const owner = await requireRoles(["owner"]);
    return jsonOk(await listOwnerBusinesses(owner.id));
  }
  if (session?.role === "super_admin") {
    return jsonOk(
      await listAdminBusinesses({
        page: query.page,
        limit: query.limit,
        q: query.q,
        category: query.category,
        city: query.city,
        isActive: query.isActive === undefined ? undefined : query.isActive === "true",
      }),
    );
  }
  return jsonOk(
    await listPublicBusinesses({
      page: query.page,
      limit: query.limit,
      q: query.q,
      category: query.category,
      city: query.city,
    }),
  );
});

export const POST = withApi(async (request) => {
  const owner = await requireRoles(["owner"]);
  const input = parseSchema(businessSchema, await readJson(request));
  return jsonOk(await createBusiness(owner.id, input), 201);
});
