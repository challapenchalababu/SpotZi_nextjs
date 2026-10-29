import { clearSession, jsonOk, withApi } from "@/lib/http";

export const POST = withApi(async () => clearSession(jsonOk({ ok: true })));
