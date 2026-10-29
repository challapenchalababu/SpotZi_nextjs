import { cleanQuery, jsonOk, parseSchema, withApi } from "@/lib/http";
import { listUsers } from "@/services/admin.service";
import { requireRoles } from "@/lib/session";
import { listQuerySchema } from "@/validators";

export const GET = withApi(async (request) => {
  await requireRoles(["super_admin"]);
  const query = parseSchema(listQuerySchema, cleanQuery(request));
  return jsonOk(
    await listUsers({
      page: query.page,
      limit: query.limit,
      q: query.q,
      role: query.role,
      isActive: query.isActive === undefined ? undefined : query.isActive === "true",
    }),
  );
});
