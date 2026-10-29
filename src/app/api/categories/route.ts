import { jsonOk, parseSchema, readJson, withApi } from "@/lib/http";
import { createCategory, listCategories } from "@/services/catalog.service";
import { getSession, requireRoles } from "@/lib/session";
import { categorySchema, listQuerySchema } from "@/validators";
import { cleanQuery } from "@/lib/http";

export const GET = withApi(async (request) => {
  const query = parseSchema(listQuerySchema, cleanQuery(request));
  const session = await getSession();
  const includeInactive = session?.role === "super_admin" && query.includeInactive === "true";
  return jsonOk(await listCategories(includeInactive));
});

export const POST = withApi(async (request) => {
  const admin = await requireRoles(["super_admin"]);
  return jsonOk(await createCategory(admin.id, parseSchema(categorySchema, await readJson(request))), 201);
});
