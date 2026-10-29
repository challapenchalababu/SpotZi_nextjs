import { jsonOk, parseSchema, readJson, withApi } from "@/lib/http";
import { createTemplate, listTemplates } from "@/services/catalog.service";
import { getSession, requireRoles } from "@/lib/session";
import { templateSchema } from "@/validators";

export const GET = withApi(async () => {
  const session = await getSession();
  return jsonOk(await listTemplates(session?.role === "super_admin"));
});

export const POST = withApi(async (request) => {
  const admin = await requireRoles(["super_admin"]);
  return jsonOk(await createTemplate(admin.id, parseSchema(templateSchema, await readJson(request))), 201);
});
