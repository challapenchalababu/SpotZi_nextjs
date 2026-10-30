import { clearSession, jsonOk, parseSchema, readJson, withApi } from "@/lib/http";
import { requireUser } from "@/lib/session";
import { deleteAccount } from "@/services/auth.service";
import { deleteAccountSchema } from "@/validators";

export const POST = withApi(async (request) => {
  const session = await requireUser();
  const input = parseSchema(deleteAccountSchema, await readJson(request));
  const result = await deleteAccount(session.id, input);
  return clearSession(jsonOk({ message: result.message }));
});
