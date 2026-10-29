import { jsonOk, parseSchema, readJson, withApi, withSession } from "@/lib/http";
import { changePassword } from "@/services/auth.service";
import { requireUser } from "@/lib/session";
import { changePasswordSchema } from "@/validators";

export const POST = withApi(async (request) => {
  const session = await requireUser();
  const input = parseSchema(changePasswordSchema, await readJson(request));
  const result = await changePassword(session.id, input);
  return withSession(jsonOk({ message: result.message }), result.token);
});
