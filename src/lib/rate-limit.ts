import { connectDB } from "@/lib/db";
import { isPreviewMode } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { RateLimitModel } from "@/models";

export async function rateLimit(key: string, limit: number, windowMs: number) {
  if (isPreviewMode()) return;
  await connectDB();
  const now = new Date();
  const since = new Date(now.getTime() - windowMs);
  const doc = await RateLimitModel.findOneAndUpdate(
    { key },
    { $pull: { hits: { $lt: since } } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  if ((doc?.hits.length ?? 0) >= limit) {
    throw new AppError(429, "rate_limited", "Too many requests. Please wait and try again.");
  }
  await RateLimitModel.updateOne({ key }, { $push: { hits: now } });
}
