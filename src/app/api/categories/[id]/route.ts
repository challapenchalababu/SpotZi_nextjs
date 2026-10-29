import { jsonOk, parseSchema, readJson, withApi } from "@/lib/http";
import { updateCategory } from "@/services/catalog.service";
import { requireRoles } from "@/lib/session";
import { categorySchema } from "@/validators";

export const PATCH = withApi<{ id: string }>(async (request, context) => {
  const { id } = await context.params;
  const admin = await requireRoles(["super_admin"]);
  return jsonOk(await updateCategory(admin.id, id, parseSchema(categorySchema, await readJson(request))));
});
