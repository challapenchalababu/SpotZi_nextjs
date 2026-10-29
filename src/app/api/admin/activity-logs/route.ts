import { cleanQuery, jsonOk, parseSchema, withApi } from "@/lib/http";
import { listActivity } from "@/services/activity.service";
import { requireRoles } from "@/lib/session";
import { listQuerySchema } from "@/validators";

export const GET = withApi(async (request) => {
  await requireRoles(["super_admin"]);
  const query = parseSchema(listQuerySchema, cleanQuery(request));
  return jsonOk(await listActivity(query.page, query.limit, query.q));
});
