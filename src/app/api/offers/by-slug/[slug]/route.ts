import { AppError } from "@/lib/errors";
import { jsonOk, withApi } from "@/lib/http";
import { getPublicOfferBySlug } from "@/services/offer.service";

export const GET = withApi<{ slug: string }>(async (_request, context) => {
  const { slug } = await context.params;
  const result = await getPublicOfferBySlug(slug);
  if (!result) throw new AppError(404, "not_found", "Offer was not found.");
  return jsonOk(result);
});
