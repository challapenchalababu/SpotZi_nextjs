import { jsonOk, parseSchema, readJson, withApi } from "@/lib/http";
import { archiveOffer, getManagedOffer, setOfferStatus, updateOffer } from "@/services/offer.service";
import { getSession, requireRoles } from "@/lib/session";
import { offerStatusSchema, updateOfferSchema } from "@/validators";

export const GET = withApi<{ id: string }>(async (_request, context) => {
  const { id } = await context.params;
  const session = await getSession();
  if (session?.role === "super_admin") return jsonOk(await getManagedOffer(id));
  const owner = await requireRoles(["owner"]);
  return jsonOk(await getManagedOffer(id, owner.id));
});

export const PATCH = withApi<{ id: string }>(async (request, context) => {
  const { id } = await context.params;
  const owner = await requireRoles(["owner"]);
  const body = await readJson(request);
  if (body && typeof body === "object" && "title" in body) {
    return jsonOk(await updateOffer(owner.id, id, parseSchema(updateOfferSchema, body)));
  }
  const status = parseSchema(offerStatusSchema, body);
  return jsonOk(await setOfferStatus(owner.id, id, status.status));
});

export const DELETE = withApi<{ id: string }>(async (_request, context) => {
  const { id } = await context.params;
  const owner = await requireRoles(["owner"]);
  return jsonOk(await archiveOffer(owner.id, id));
});
