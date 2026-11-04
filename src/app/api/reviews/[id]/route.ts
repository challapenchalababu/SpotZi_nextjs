import { AppError } from "@/lib/errors";
import { jsonOk, parseSchema, readJson, withApi } from "@/lib/http";
import { requireRoles, requireUser } from "@/lib/session";
import { deleteOwnReview, hardDeleteReviewAsAdmin, updateOwnReview } from "@/services/review.service";
import { reviewUpdateSchema } from "@/validators";

export const PATCH = withApi<{ id: string }>(async (request, context) => {
  const customer = await requireRoles(["customer"]);
  const { id } = await context.params;
  return jsonOk(await updateOwnReview(customer.id, id, parseSchema(reviewUpdateSchema, await readJson(request))));
});

export const DELETE = withApi<{ id: string }>(async (_request, context) => {
  const session = await requireUser();
  const { id } = await context.params;
  if (session.role === "super_admin") {
    return jsonOk(await hardDeleteReviewAsAdmin(session.id, id));
  }
  if (session.role === "customer") {
    return jsonOk(await deleteOwnReview(session.id, id));
  }
  throw new AppError(403, "forbidden", "You do not have permission to do that.");
});
