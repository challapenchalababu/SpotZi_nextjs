import { jsonOk, parseSchema, readJson, withApi } from "@/lib/http";
import { resetPassword } from "@/services/auth.service";
import { resetSchema } from "@/validators";

export const POST = withApi(async (request) => {
  const input = parseSchema(resetSchema, await readJson(request));
  return jsonOk(await resetPassword(input));
});
