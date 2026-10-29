import { AppError } from "@/lib/errors";
import { cleanQuery, jsonOk, parseSchema, readJson, withApi } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { createReport, listReportsForAdmin, listReportsForOwner } from "@/services/engagement.service";
import { requireUser } from "@/lib/session";
import { listQuerySchema, reportSchema } from "@/validators";

export const GET = withApi(async (request) => {
  const session = await requireUser();
  const query = parseSchema(listQuerySchema, cleanQuery(request));
  if (session.role === "super_admin") return jsonOk(await listReportsForAdmin(query.page, query.limit, query.status));
  if (session.role === "owner") return jsonOk(await listReportsForOwner(session.id, query.page, query.limit));
  throw new AppError(403, "forbidden", "You do not have permission to do that.");
});

export const POST = withApi(async (request) => {
  const session = await requireUser();
  if (session.role !== "customer") throw new AppError(403, "forbidden", "Only customers can report offers.");
  await rateLimit(`report:${session.id}`, 5, 60 * 60 * 1000);
  return jsonOk(await createReport(session.id, parseSchema(reportSchema, await readJson(request))), 201);
});
