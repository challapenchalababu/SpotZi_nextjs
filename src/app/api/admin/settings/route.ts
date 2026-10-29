import { jsonOk, parseSchema, readJson, withApi } from "@/lib/http";
import { getPlatformSettings, updatePlatformSettings } from "@/services/catalog.service";
import { requireRoles } from "@/lib/session";
import { settingsSchema } from "@/validators";

export const GET = withApi(async () => {
  await requireRoles(["super_admin"]);
  return jsonOk(await getPlatformSettings());
});

export const PATCH = withApi(async (request) => {
  const admin = await requireRoles(["super_admin"]);
  return jsonOk(await updatePlatformSettings(admin.id, parseSchema(settingsSchema, await readJson(request))));
});
