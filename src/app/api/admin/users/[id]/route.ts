import { jsonOk, parseSchema, readJson, withApi } from "@/lib/http";
import { setUserActive } from "@/services/admin.service";
import { requireRoles } from "@/lib/session";
import { userStatusSchema } from "@/validators";

export const PATCH = withApi<{ id: string }>(async (request, context) => {
  const admin = await requireRoles(["super_admin"]);
  const { id } = await context.params;
  const input = parseSchema(userStatusSchema, await readJson(request));
  return jsonOk(await setUserActive(admin.id, id, input.isActive));
});
