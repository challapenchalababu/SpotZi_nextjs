import { jsonOk, withApi } from "@/lib/http";
import { connectDB } from "@/lib/db";

export const GET = withApi(async () => {
  if (!process.env.MONGODB_URI) return jsonOk({ ok: false, database: "unconfigured" });
  try {
    await connectDB();
    return jsonOk({ ok: true, database: "connected" });
  } catch {
    return jsonOk({ ok: false, database: "unavailable" });
  }
});
