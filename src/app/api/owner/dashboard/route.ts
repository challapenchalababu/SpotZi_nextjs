import { jsonOk, withApi } from "@/lib/http";
import { ownerStats } from "@/services/admin.service";
import { requireRoles } from "@/lib/session";

export const GET = withApi(async () => {
  const owner = await requireRoles(["owner"]);
  return jsonOk(await ownerStats(owner.id));
});
