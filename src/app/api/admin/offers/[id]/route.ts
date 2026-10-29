import { jsonOk, parseSchema, readJson, withApi } from "@/lib/http";
import { setOfferStatus } from "@/services/offer.service";
import { requireRoles } from "@/lib/session";
import { adminOfferStatusSchema } from "@/validators";

export const PATCH = withApi<{ id: string }>(async (request, context) => {
  const admin = await requireRoles(["super_admin"]);
  const { id } = await context.params;
  const input = parseSchema(adminOfferStatusSchema, await readJson(request));
  return jsonOk(await setOfferStatus(admin.id, id, input.status, true));
});
