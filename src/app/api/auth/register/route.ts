import { clientIp, jsonOk, parseSchema, readJson, withApi, withSession } from "@/lib/http";
import { registerAccount } from "@/services/auth.service";
import { registerSchema } from "@/validators";

export const POST = withApi(async (request) => {
  const input = parseSchema(registerSchema, await readJson(request));
  const result = await registerAccount(input, clientIp(request));
  return withSession(jsonOk({ user: result.user, redirectTo: result.redirectTo }, 201), result.token);
});
