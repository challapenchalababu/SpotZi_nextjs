import { cleanQuery, jsonOk, parseSchema, withApi } from "@/lib/http";
import { listReportsForAdmin } from "@/services/engagement.service";
import { requireRoles } from "@/lib/session";
import { listQuerySchema } from "@/validators";

export const GET = withApi(async (request) => {
  await requireRoles(["super_admin"]);
  const query = parseSchema(listQuerySchema, cleanQuery(request));
  return jsonOk(await listReportsForAdmin(query.page, query.limit, query.status));
});
