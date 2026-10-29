import { cleanQuery, jsonOk, parseSchema, readJson, withApi } from "@/lib/http";
import { claimOffer, listRedemptionsForOwner, listRedemptionsForUser } from "@/services/engagement.service";
import { requireUser } from "@/lib/session";
import { listQuerySchema, redemptionSchema } from "@/validators";
import { AppError } from "@/lib/errors";

export const GET = withApi(async (request) => {
  const session = await requireUser();
  const query = parseSchema(listQuerySchema, cleanQuery(request));
  if (session.role === "owner") return jsonOk(await listRedemptionsForOwner(session.id, query.page, query.limit));
  if (session.role === "customer") return jsonOk(await listRedemptionsForUser(session.id));
  throw new AppError(403, "forbidden", "You do not have permission to do that.");
});

export const POST = withApi(async (request) => {
  const session = await requireUser();
  if (session.role !== "customer") throw new AppError(403, "forbidden", "Only customers can claim offers.");
  const input = parseSchema(redemptionSchema, await readJson(request));
  return jsonOk(await claimOffer(session.id, input.offerId), 201);
});
