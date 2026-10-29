import { jsonOk, parseSchema, readJson, withApi } from "@/lib/http";
import { getBranchForOwner, updateBranch } from "@/services/business.service";
import { requireRoles } from "@/lib/session";
import { branchSchema } from "@/validators";

export const GET = withApi<{ id: string }>(async (_request, context) => {
  const { id } = await context.params;
  const owner = await requireRoles(["owner"]);
  return jsonOk(await getBranchForOwner(owner.id, id));
});

export const PATCH = withApi<{ id: string }>(async (request, context) => {
  const { id } = await context.params;
  const owner = await requireRoles(["owner"]);
  return jsonOk(await updateBranch(owner.id, id, parseSchema(branchSchema, await readJson(request))));
});
