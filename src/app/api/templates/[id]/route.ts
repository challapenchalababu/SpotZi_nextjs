import { AppError } from "@/lib/errors";
import { jsonOk, parseSchema, readJson, withApi } from "@/lib/http";
import { getTemplate, updateTemplate } from "@/services/catalog.service";
import { getSession, requireRoles } from "@/lib/session";
import { templateSchema } from "@/validators";

export const GET = withApi<{ id: string }>(async (_request, context) => {
  const { id } = await context.params;
  const session = await getSession();
  const template = await getTemplate(id, session?.role === "super_admin");
  if (!template) throw new AppError(404, "not_found", "Template was not found.");
  return jsonOk(template);
});

export const PATCH = withApi<{ id: string }>(async (request, context) => {
  const { id } = await context.params;
  const admin = await requireRoles(["super_admin"]);
  return jsonOk(await updateTemplate(admin.id, id, parseSchema(templateSchema, await readJson(request))));
});
