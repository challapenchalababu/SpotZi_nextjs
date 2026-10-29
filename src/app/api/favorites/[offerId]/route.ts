import { jsonOk, withApi } from "@/lib/http";
import { addFavorite, removeFavorite } from "@/services/engagement.service";
import { requireRoles } from "@/lib/session";

export const POST = withApi<{ offerId: string }>(async (_request, context) => {
  const { offerId } = await context.params;
  const customer = await requireRoles(["customer"]);
  return jsonOk(await addFavorite(customer.id, offerId), 201);
});

export const DELETE = withApi<{ offerId: string }>(async (_request, context) => {
  const { offerId } = await context.params;
  const customer = await requireRoles(["customer"]);
  return jsonOk(await removeFavorite(customer.id, offerId));
});
