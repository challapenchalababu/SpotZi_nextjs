import { cleanQuery, jsonOk, parseSchema, readJson, withApi } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { getSession, requireRoles } from "@/lib/session";
import { listPublicReviews, upsertReview } from "@/services/review.service";
import { listQuerySchema, reviewSchema } from "@/validators";
import { z } from "zod";

const listReviewsQuery = listQuerySchema.extend({
  targetType: z.enum(["offer", "store"]),
  targetId: z.string().min(1),
});

export const GET = withApi(async (request) => {
  const query = parseSchema(listReviewsQuery, cleanQuery(request));
  const session = await getSession().catch(() => null);
  return jsonOk(
    await listPublicReviews({
      targetType: query.targetType,
      targetId: query.targetId,
      page: query.page,
      limit: query.limit,
      viewerId: session?.role === "customer" ? session.id : undefined,
    }),
  );
});

export const POST = withApi(async (request) => {
  const customer = await requireRoles(["customer"]);
  await rateLimit(`review:${customer.id}`, 20, 60 * 60 * 1000);
  const input = parseSchema(reviewSchema, await readJson(request));
  return jsonOk(await upsertReview(customer.id, input), 201);
});
