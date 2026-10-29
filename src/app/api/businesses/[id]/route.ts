import { jsonOk, parseSchema, readJson, withApi } from "@/lib/http";
import { getBusinessForOwner, updateBusiness } from "@/services/business.service";
import { requireRoles } from "@/lib/session";
import { businessSchema } from "@/validators";

export const GET = withApi<{ id: string }>(async (_request, context) => {
  const { id } = await context.params;
  const owner = await requireRoles(["owner"]);
  return jsonOk(await getBusinessForOwner(owner.id, id));
});

export const PATCH = withApi<{ id: string }>(async (request, context) => {
  const { id } = await context.params;
  const owner = await requireRoles(["owner"]);
  const input = parseSchema(businessSchema, await readJson(request));
  return jsonOk(await updateBusiness(owner.id, id, input));
});
