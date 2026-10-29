import { isAppError } from "@/lib/errors";
import { jsonOk, parseSchema, readJson, withApi } from "@/lib/http";
import { updateProfile } from "@/services/auth.service";
import { getSession, requireUser } from "@/lib/session";
import { profileSchema } from "@/validators";

export const GET = withApi(async () => {
  try {
    return jsonOk({ user: await getSession() });
  } catch (error) {
    if (isAppError(error) && error.status === 503) return jsonOk({ user: null });
    throw error;
  }
});

export const PATCH = withApi(async (request) => {
  const session = await requireUser();
  const input = parseSchema(profileSchema, await readJson(request));
  return jsonOk({ user: await updateProfile(session.id, input) });
});
