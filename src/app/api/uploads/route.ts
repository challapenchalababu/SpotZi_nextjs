import { AppError } from "@/lib/errors";
import { clientIp, jsonOk, withApi } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { requireRoles } from "@/lib/session";
import { storeImage } from "@/lib/upload";

export const POST = withApi(async (request) => {
  const session = await requireRoles(["owner", "super_admin"]);
  await rateLimit(`upload:${session.id}:${clientIp(request)}`, 30, 60 * 60 * 1000);
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new AppError(400, "invalid_upload", "Choose an image file.");
  const url = await storeImage(new Uint8Array(await file.arrayBuffer()), file.type);
  return jsonOk({ url });
});
