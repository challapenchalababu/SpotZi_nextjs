import { clientIp, jsonOk, parseSchema, readJson, withApi } from "@/lib/http";
import { requestPasswordReset } from "@/services/auth.service";
import { forgotSchema } from "@/validators";

export const POST = withApi(async (request) => {
  const input = parseSchema(forgotSchema, await readJson(request));
  return jsonOk(await requestPasswordReset(input, clientIp(request)));
});
