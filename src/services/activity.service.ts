import { previewActivity } from "@/data/preview-store";
import { connectDB } from "@/lib/db";
import { isPreviewMode } from "@/lib/env";
import { logError } from "@/lib/logger";
import { sanitizeMetadata } from "@/lib/sanitize";
import { ActivityLogModel, UserModel, type ActivityRecord, type UserRecord } from "@/models";
import { toActivity } from "@/lib/serialize";
import type { PageResult, ActivityDTO } from "@/types/domain";

export async function logActivity(entry: {
  actorId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}) {
  if (isPreviewMode()) return;
  try {
    await connectDB();
    await ActivityLogModel.create({
      actorId: entry.actorId || undefined,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      metadata: sanitizeMetadata(entry.metadata),
    });
  } catch (error) {
    logError(error);
  }
}

export async function listActivity(page: number, limit: number, q?: string): Promise<PageResult<ActivityDTO>> {
  if (isPreviewMode()) return previewActivity(page, limit, q);
  await connectDB();
  const filter = q ? { action: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") } : {};
  const skip = (page - 1) * limit;
  const [docs, total] = await Promise.all([
    ActivityLogModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean() as Promise<ActivityRecord[]>,
    ActivityLogModel.countDocuments(filter),
  ]);
  const actorIds = docs.flatMap((doc) => (doc.actorId ? [doc.actorId] : []));
  const actors = (await UserModel.find({ _id: { $in: actorIds } }).select("name").lean()) as UserRecord[];
  const names = new Map(actors.map((actor) => [String(actor._id), actor.name]));
  return {
    items: docs.map((doc) => toActivity(doc, doc.actorId ? names.get(String(doc.actorId)) : undefined)),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
