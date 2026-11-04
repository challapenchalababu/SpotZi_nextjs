import { cleanQuery, jsonOk, parseSchema, withApi } from "@/lib/http";
import { requireRoles } from "@/lib/session";
import { listReviewsForAdmin } from "@/services/review.service";
import { listQuerySchema } from "@/validators";
import { z } from "zod";

const adminReviewsQuery = listQuerySchema.extend({
  targetType: z.enum(["offer", "store", "all"]).optional(),
});

export const GET = withApi(async (request) => {
  await requireRoles(["super_admin"]);
  const query = parseSchema(adminReviewsQuery, cleanQuery(request));
  return jsonOk(
    await listReviewsForAdmin({
      page: query.page,
      limit: query.limit,
      status: query.status,
      targetType: query.targetType === "all" ? undefined : query.targetType,
      q: query.q,
    }),
  );
});
