import { AppError } from "@/lib/errors";
import { jsonOk, readJson, withApi } from "@/lib/http";
import { requireRoles } from "@/lib/session";
import { hardDeleteReviewAsAdmin, removeReviewAsAdmin, restoreReviewAsAdmin } from "@/services/review.service";

export const PATCH = withApi<{ id: string }>(async (request, context) => {
  const admin = await requireRoles(["super_admin"]);
  const { id } = await context.params;
  const body = (await readJson(request)) as { action?: string };
  if (body.action === "restore") return jsonOk(await restoreReviewAsAdmin(admin.id, id));
  if (body.action === "remove") return jsonOk(await removeReviewAsAdmin(admin.id, id));
  throw new AppError(400, "invalid_action", "Use action remove or restore.");
});

export const DELETE = withApi<{ id: string }>(async (_request, context) => {
  const admin = await requireRoles(["super_admin"]);
  const { id } = await context.params;
  return jsonOk(await hardDeleteReviewAsAdmin(admin.id, id));
});
