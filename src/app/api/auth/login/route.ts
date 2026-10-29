import { clientIp, jsonOk, parseSchema, readJson, withApi, withSession } from "@/lib/http";
import { loginAccount } from "@/services/auth.service";
import { loginSchema } from "@/validators";

export const POST = withApi(async (request) => {
  const input = parseSchema(loginSchema, await readJson(request));
  const result = await loginAccount(input, clientIp(request));
  return withSession(jsonOk({ user: result.user, redirectTo: result.redirectTo }), result.token);
});
