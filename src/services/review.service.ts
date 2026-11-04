import { connectDB } from "@/lib/db";
import { isPreviewMode } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { BranchModel, BusinessModel, OfferModel, ReviewModel, UserModel, type ReviewRecord } from "@/models";
import { toObjectId } from "@/services/access";
import { logActivity } from "@/services/activity.service";
import type { PageResult, ReviewDTO, ReviewSummary, ReviewTargetType } from "@/types/domain";
import type { z } from "zod";
import type { reviewSchema, reviewUpdateSchema } from "@/validators";

type ReviewInput = z.infer<typeof reviewSchema>;
type ReviewUpdateInput = z.infer<typeof reviewUpdateSchema>;

function iso(value?: Date | null) {
  return value ? value.toISOString() : new Date(0).toISOString();
}

function emptyPage<T>(page: number, limit: number): PageResult<T> {
  return { items: [], page, limit, total: 0, totalPages: 1 };
}

async function resolveTarget(targetType: ReviewTargetType, targetId: string) {
  await connectDB();
  if (targetType === "offer") {
    const offer = await OfferModel.findById(toObjectId(targetId, "Offer")).lean();
    if (!offer || offer.status === "archived") throw new AppError(404, "not_found", "Offer was not found.");
    return {
      targetType,
      targetId: offer._id,
      offerId: offer._id,
      branchId: offer.branchId,
      businessId: offer.businessId,
      offerTitle: offer.title,
    };
  }

  const branch = await BranchModel.findById(toObjectId(targetId, "Store")).lean();
  if (!branch || !branch.isActive) throw new AppError(404, "not_found", "Store was not found.");
  return {
    targetType,
    targetId: branch._id,
    branchId: branch._id,
    businessId: branch.businessId,
    branchName: branch.branchName,
  };
}

async function enrichReviews(docs: ReviewRecord[], viewerId?: string): Promise<ReviewDTO[]> {
  const userIds = [...new Set(docs.map((doc) => String(doc.userId)))];
  const offerIds = [...new Set(docs.map((doc) => (doc.offerId ? String(doc.offerId) : "")).filter(Boolean))];
  const branchIds = [...new Set(docs.map((doc) => (doc.branchId ? String(doc.branchId) : "")).filter(Boolean))];
  const businessIds = [...new Set(docs.map((doc) => (doc.businessId ? String(doc.businessId) : "")).filter(Boolean))];

  const [users, offers, branches, businesses] = await Promise.all([
    userIds.length ? UserModel.find({ _id: { $in: userIds } }).select("name").lean() : [],
    offerIds.length ? OfferModel.find({ _id: { $in: offerIds } }).select("title").lean() : [],
    branchIds.length ? BranchModel.find({ _id: { $in: branchIds } }).select("branchName").lean() : [],
    businessIds.length ? BusinessModel.find({ _id: { $in: businessIds } }).select("businessName").lean() : [],
  ]);

  const userNames = new Map(users.map((user) => [String(user._id), user.name]));
  const offerTitles = new Map(offers.map((offer) => [String(offer._id), offer.title]));
  const branchNames = new Map(branches.map((branch) => [String(branch._id), branch.branchName]));
  const businessNames = new Map(businesses.map((business) => [String(business._id), business.businessName]));

  return docs.map((doc) => ({
    id: String(doc._id),
    userId: String(doc.userId),
    userName: userNames.get(String(doc.userId)),
    targetType: doc.targetType,
    targetId: String(doc.targetId),
    offerId: doc.offerId ? String(doc.offerId) : undefined,
    offerTitle: doc.offerId ? offerTitles.get(String(doc.offerId)) : undefined,
    branchId: doc.branchId ? String(doc.branchId) : undefined,
    branchName: doc.branchId ? branchNames.get(String(doc.branchId)) : undefined,
    businessId: doc.businessId ? String(doc.businessId) : undefined,
    businessName: doc.businessId ? businessNames.get(String(doc.businessId)) : undefined,
    rating: doc.rating,
    comment: doc.comment,
    status: doc.status,
    mine: viewerId ? String(doc.userId) === viewerId : false,
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  }));
}

export async function getReviewSummary(targetType: ReviewTargetType, targetId: string): Promise<ReviewSummary> {
  if (isPreviewMode()) return { averageRating: 0, reviewCount: 0 };
  await connectDB();
  const rows = await ReviewModel.aggregate<{ averageRating: number; reviewCount: number }>([
    {
      $match: {
        targetType,
        targetId: toObjectId(targetId, targetType === "offer" ? "Offer" : "Store"),
        status: "visible",
      },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);
  const row = rows[0];
  if (!row) return { averageRating: 0, reviewCount: 0 };
  return {
    averageRating: Math.round(row.averageRating * 10) / 10,
    reviewCount: row.reviewCount,
  };
}

export async function listPublicReviews(input: {
  targetType: ReviewTargetType;
  targetId: string;
  page?: number;
  limit?: number;
  viewerId?: string;
}): Promise<PageResult<ReviewDTO> & { summary: ReviewSummary; mine?: ReviewDTO | null }> {
  const page = input.page || 1;
  const limit = input.limit || 10;
  if (isPreviewMode()) {
    return { ...emptyPage(page, limit), summary: { averageRating: 0, reviewCount: 0 }, mine: null };
  }
  await resolveTarget(input.targetType, input.targetId);
  await connectDB();
  const filter = {
    targetType: input.targetType,
    targetId: toObjectId(input.targetId, input.targetType === "offer" ? "Offer" : "Store"),
    status: "visible" as const,
  };
  const [total, docs, summary, mineDoc] = await Promise.all([
    ReviewModel.countDocuments(filter),
    ReviewModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    getReviewSummary(input.targetType, input.targetId),
    input.viewerId
      ? ReviewModel.findOne({ ...filter, userId: toObjectId(input.viewerId, "User") }).lean()
      : Promise.resolve(null),
  ]);
  const items = await enrichReviews(docs as ReviewRecord[], input.viewerId);
  const mine = mineDoc ? (await enrichReviews([mineDoc as ReviewRecord], input.viewerId))[0] : null;
  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    summary,
    mine,
  };
}

export async function upsertReview(userId: string, input: ReviewInput): Promise<ReviewDTO> {
  if (isPreviewMode()) throw new AppError(503, "preview_mode", "Reviews are unavailable in preview mode.");
  const target = await resolveTarget(input.targetType, input.targetId);
  await connectDB();

  const existing = await ReviewModel.findOne({
    userId: toObjectId(userId, "User"),
    targetType: input.targetType,
    targetId: target.targetId,
    status: "visible",
  });

  if (existing) {
    existing.rating = input.rating;
    existing.comment = input.comment.trim();
    await existing.save();
    await logActivity({
      actorId: userId,
      action: "review.update",
      resourceType: "review",
      resourceId: String(existing._id),
      metadata: { targetType: input.targetType, rating: input.rating },
    });
    return (await enrichReviews([existing.toObject()], userId))[0];
  }

  try {
    const created = await ReviewModel.create({
      userId: toObjectId(userId, "User"),
      targetType: input.targetType,
      targetId: target.targetId,
      branchId: target.branchId,
      businessId: target.businessId,
      offerId: target.offerId,
      rating: input.rating,
      comment: input.comment.trim(),
      status: "visible",
    });
    await logActivity({
      actorId: userId,
      action: "review.create",
      resourceType: "review",
      resourceId: String(created._id),
      metadata: { targetType: input.targetType, rating: input.rating },
    });
    return (await enrichReviews([created.toObject()], userId))[0];
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      throw new AppError(409, "duplicate_review", "You already reviewed this. Edit your existing review instead.");
    }
    throw error;
  }
}

export async function updateOwnReview(userId: string, reviewId: string, input: ReviewUpdateInput): Promise<ReviewDTO> {
  await connectDB();
  const review = await ReviewModel.findById(toObjectId(reviewId, "Review"));
  if (!review || review.status !== "visible" || String(review.userId) !== userId) {
    throw new AppError(404, "not_found", "Review was not found.");
  }
  review.rating = input.rating;
  review.comment = input.comment.trim();
  await review.save();
  await logActivity({
    actorId: userId,
    action: "review.update",
    resourceType: "review",
    resourceId: String(review._id),
  });
  return (await enrichReviews([review.toObject()], userId))[0];
}

export async function deleteOwnReview(userId: string, reviewId: string) {
  await connectDB();
  const review = await ReviewModel.findById(toObjectId(reviewId, "Review"));
  if (!review || review.status !== "visible" || String(review.userId) !== userId) {
    throw new AppError(404, "not_found", "Review was not found.");
  }
  await ReviewModel.deleteOne({ _id: review._id });
  await logActivity({
    actorId: userId,
    action: "review.delete",
    resourceType: "review",
    resourceId: String(review._id),
  });
  return { ok: true };
}

export async function listReviewsForAdmin(input: {
  page: number;
  limit: number;
  status?: string;
  targetType?: string;
  q?: string;
}): Promise<PageResult<ReviewDTO>> {
  if (isPreviewMode()) return emptyPage(input.page, input.limit);
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (input.status && input.status !== "all") filter.status = input.status;
  if (input.targetType === "offer" || input.targetType === "store") filter.targetType = input.targetType;
  if (input.q) {
    const expression = new RegExp(input.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.comment = expression;
  }
  const [total, docs] = await Promise.all([
    ReviewModel.countDocuments(filter),
    ReviewModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((input.page - 1) * input.limit)
      .limit(input.limit)
      .lean(),
  ]);
  return {
    items: await enrichReviews(docs as ReviewRecord[]),
    page: input.page,
    limit: input.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / input.limit)),
  };
}

export async function removeReviewAsAdmin(adminId: string, reviewId: string) {
  await connectDB();
  const review = await ReviewModel.findById(toObjectId(reviewId, "Review"));
  if (!review) throw new AppError(404, "not_found", "Review was not found.");
  if (review.status === "removed") return { ok: true };
  review.status = "removed";
  review.removedBy = toObjectId(adminId, "User");
  review.removedAt = new Date();
  await review.save();
  await logActivity({
    actorId: adminId,
    action: "review.remove",
    resourceType: "review",
    resourceId: String(review._id),
    metadata: { targetType: review.targetType },
  });
  return { ok: true };
}

export async function restoreReviewAsAdmin(adminId: string, reviewId: string) {
  await connectDB();
  const review = await ReviewModel.findById(toObjectId(reviewId, "Review"));
  if (!review) throw new AppError(404, "not_found", "Review was not found.");
  const clash = await ReviewModel.findOne({
    _id: { $ne: review._id },
    userId: review.userId,
    targetType: review.targetType,
    targetId: review.targetId,
    status: "visible",
  }).lean();
  if (clash) {
    throw new AppError(409, "duplicate_review", "This customer already has another visible review for the same target.");
  }
  review.status = "visible";
  review.removedBy = undefined;
  review.removedAt = undefined;
  await review.save();
  await logActivity({
    actorId: adminId,
    action: "review.restore",
    resourceType: "review",
    resourceId: String(review._id),
  });
  return { ok: true };
}

export async function hardDeleteReviewAsAdmin(adminId: string, reviewId: string) {
  await connectDB();
  const review = await ReviewModel.findById(toObjectId(reviewId, "Review"));
  if (!review) throw new AppError(404, "not_found", "Review was not found.");
  await ReviewModel.deleteOne({ _id: review._id });
  await logActivity({
    actorId: adminId,
    action: "review.hard_delete",
    resourceType: "review",
    resourceId: String(review._id),
  });
  return { ok: true };
}
