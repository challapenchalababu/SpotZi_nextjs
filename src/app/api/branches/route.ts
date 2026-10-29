import { cleanQuery, jsonOk, parseSchema, readJson, withApi } from "@/lib/http";
import { createBranch, listBranchesForOwner } from "@/services/business.service";
import { requireRoles } from "@/lib/session";
import { branchSchema, listQuerySchema } from "@/validators";

export const GET = withApi(async (request) => {
  const owner = await requireRoles(["owner"]);
  const query = parseSchema(listQuerySchema, cleanQuery(request));
  return jsonOk(await listBranchesForOwner(owner.id, query.businessId));
});

export const POST = withApi(async (request) => {
  const owner = await requireRoles(["owner"]);
  const input = parseSchema(branchSchema, await readJson(request));
  return jsonOk(await createBranch(owner.id, input), 201);
});
