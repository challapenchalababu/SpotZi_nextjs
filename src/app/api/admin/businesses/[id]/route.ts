import { jsonOk, parseSchema, readJson, withApi } from "@/lib/http";
import { setBusinessActive } from "@/services/business.service";
import { requireRoles } from "@/lib/session";
import { activeFlagSchema } from "@/validators";

export const PATCH = withApi<{ id: string }>(async (request, context) => {
  const admin = await requireRoles(["super_admin"]);
  const { id } = await context.params;
  const input = parseSchema(activeFlagSchema, await readJson(request));
  return jsonOk(await setBusinessActive(admin.id, id, input.isActive));
});
