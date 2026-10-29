import { jsonOk, parseSchema, readJson, withApi } from "@/lib/http";
import { updateRedemption } from "@/services/engagement.service";
import { requireRoles } from "@/lib/session";
import { redemptionUpdateSchema } from "@/validators";

export const PATCH = withApi<{ id: string }>(async (request, context) => {
  const { id } = await context.params;
  const owner = await requireRoles(["owner"]);
  const input = parseSchema(redemptionUpdateSchema, await readJson(request));
  return jsonOk(await updateRedemption(owner.id, id, input.status));
});
