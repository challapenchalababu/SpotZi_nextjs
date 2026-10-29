import { jsonOk, withApi } from "@/lib/http";
import { adminStats } from "@/services/admin.service";
import { requireRoles } from "@/lib/session";

export const GET = withApi(async () => {
  await requireRoles(["super_admin"]);
  return jsonOk(await adminStats());
});
