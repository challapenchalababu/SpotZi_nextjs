import { jsonOk, parseSchema, readJson, withApi } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { requireRoles } from "@/lib/session";
import { verifyRedemptionCode } from "@/services/redemption-check";
import { redemptionVerifySchema } from "@/validators";

export const POST = withApi(async (request) => {
  const owner = await requireRoles(["owner"]);
  await rateLimit(`redemption-verify:${owner.id}`, 30, 60 * 1000);
  const input = parseSchema(redemptionVerifySchema, await readJson(request));
  return jsonOk(await verifyRedemptionCode(owner.id, input.code));
});
