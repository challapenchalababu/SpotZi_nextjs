import { jsonOk, parseSchema, readJson, withApi } from "@/lib/http";
import { updateReport } from "@/services/engagement.service";
import { requireRoles } from "@/lib/session";
import { reportUpdateSchema } from "@/validators";

export const PATCH = withApi<{ id: string }>(async (request, context) => {
  const admin = await requireRoles(["super_admin"]);
  const { id } = await context.params;
  return jsonOk(await updateReport(admin.id, id, parseSchema(reportUpdateSchema, await readJson(request))));
});
