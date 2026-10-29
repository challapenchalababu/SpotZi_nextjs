import { jsonOk, withApi } from "@/lib/http";
import { listFavorites } from "@/services/engagement.service";
import { requireRoles } from "@/lib/session";

export const GET = withApi(async () => {
  const customer = await requireRoles(["customer"]);
  return jsonOk(await listFavorites(customer.id));
});
