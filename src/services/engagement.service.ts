import { randomInt } from "node:crypto";
import { previewFavorites, previewIsFavorite, previewRedemptionsForOwner, previewRedemptionsForUser, previewReportsForAdmin, previewReportsForOwner, previewSaveCounts } from "@/data/preview-store";
import { connectDB } from "@/lib/db";
import { isPreviewMode } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { isWithinSchedule } from "@/lib/offer-validity";
import { toFavorite, toRedemption, toReport } from "@/lib/serialize";
import {
  BranchModel,
  BusinessModel,
  FavoriteModel,
  OfferModel,
  RedemptionModel,
  ReportModel,
  UserModel,
} from "@/models";
import { ownerBusinessIds, toObjectId } from "@/services/access";
import { logActivity } from "@/services/activity.service";
import type { FavoriteDTO, PageResult, RedemptionDTO, ReportDTO, ReportStatus } from "@/types/domain";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function redemptionCode() {
  let code = "";
  for (let index = 0; index < 10; index += 1) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return code;
}

function duplicateKeys(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error) || error.code !== 11000) return null;
  const pattern = "keyPattern" in error && error.keyPattern && typeof error.keyPattern === "object" ? error.keyPattern : {};
  return Object.keys(pattern);
}

async function visibleOffer(offerId: string) {
  const offer = await OfferModel.findById(toObjectId(offerId, "Offer"));
  if (!offer || offer.status !== "published") throw new AppError(404, "not_found", "Offer was not found.");
  const [business, branch] = await Promise.all([
    BusinessModel.findById(offer.businessId),
    BranchModel.findById(offer.branchId),
  ]);
  if (!business?.isActive || !branch?.isActive) throw new AppError(404, "not_found", "Offer was not found.");
  return { offer, business, branch };
}

export async function listFavorites(userId: string): Promise<FavoriteDTO[]> {
  if (isPreviewMode()) return previewFavorites(userId);
  await connectDB();
  const docs = await FavoriteModel.find({ userId }).sort({ createdAt: -1 }).lean();
  const offers = await OfferModel.find({ _id: { $in: docs.map((doc) => doc.offerId) } })
    .populate("businessId")
    .populate("branchId")
    .populate("templateId")
    .lean();
  const { toPublicOffer } = await import("@/lib/serialize");
  return docs.flatMap((doc) => {
    const offer = offers.find((item) => String(item._id) === String(doc.offerId));
    if (!offer) return [];
    const business = offer.businessId as { businessName?: string; isActive?: boolean; _id: unknown };
    const branch = offer.branchId as { branchName?: string; isActive?: boolean; address?: unknown; location?: { coordinates: [number, number] }; openingHours?: never; _id: unknown };
    if (!business?.businessName || !branch?.branchName || !business.isActive || !branch.isActive) return [];
    const populated = offer as unknown as Parameters<typeof toPublicOffer>[0]["offer"] & {
      businessId: Parameters<typeof toPublicOffer>[0]["business"];
      branchId: Parameters<typeof toPublicOffer>[0]["branch"];
    };
    if (!("businessName" in populated.businessId) || !("branchName" in populated.branchId)) return [];
    return [toFavorite(doc, toPublicOffer({
      offer: { ...populated, businessId: populated.businessId._id, branchId: populated.branchId._id },
      business: populated.businessId,
      branch: populated.branchId,
    }))];
  });
}

export async function addFavorite(userId: string, offerId: string) {
  await visibleOffer(offerId);
  try {
    const doc = await FavoriteModel.create({ userId, offerId });
    await logActivity({ actorId: userId, action: "favorite.add", resourceType: "offer", resourceId: offerId });
    return { id: String(doc._id), offerId };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      const existing = await FavoriteModel.findOne({ userId, offerId }).lean();
      return { id: String(existing?._id ?? ""), offerId };
    }
    throw error;
  }
}

export async function removeFavorite(userId: string, offerId: string) {
  await connectDB();
  await FavoriteModel.deleteOne({ userId, offerId: toObjectId(offerId, "Offer") });
  await logActivity({ actorId: userId, action: "favorite.remove", resourceType: "offer", resourceId: offerId });
  return { offerId };
}

export async function isFavorite(userId: string, offerId: string) {
  if (isPreviewMode()) return previewIsFavorite(userId, offerId);
  await connectDB();
  const doc = await FavoriteModel.exists({ userId, offerId });
  return Boolean(doc);
}

export async function claimOffer(userId: string, offerId: string): Promise<RedemptionDTO> {
  const { offer, business, branch } = await visibleOffer(offerId);
  if (!isWithinSchedule(offer)) {
    throw new AppError(400, "unavailable", "This offer cannot be claimed right now.");
  }
  const existing = await RedemptionModel.findOne({ userId, offerId: offer._id, status: { $in: ["claimed", "redeemed"] } });
  if (existing) {
    const customer = await UserModel.findById(userId).select("name").lean();
    return toRedemption(existing.toObject(), {
      offerTitle: offer.title,
      offerSlug: offer.slug,
      branchName: branch.branchName,
      businessName: business.businessName,
      customerName: customer?.name,
    });
  }
  if (offer.redemptionLimit != null) {
    const used = await RedemptionModel.countDocuments({ offerId: offer._id, status: { $in: ["claimed", "redeemed"] } });
    if (used >= offer.redemptionLimit) throw new AppError(409, "limit_reached", "This offer has reached its redemption limit.");
  }
  let created = null;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      created = await RedemptionModel.create({
        userId,
        offerId: offer._id,
        branchId: branch._id,
        redemptionCode: redemptionCode(),
        status: "claimed",
        claimedAt: new Date(),
      });
      break;
    } catch (error) {
      const keys = duplicateKeys(error);
      if (!keys) throw error;
      if (keys.includes("userId")) {
        created = await RedemptionModel.findOne({ userId, offerId: offer._id, status: { $in: ["claimed", "redeemed"] } });
        if (created) break;
      }
    }
  }
  if (!created) throw new AppError(500, "code_failed", "Could not create a unique redemption code. Try again.");
  await logActivity({ actorId: userId, action: "redemption.claim", resourceType: "redemption", resourceId: String(created._id) });
  const customer = await UserModel.findById(userId).select("name").lean();
  return toRedemption(created.toObject(), {
    offerTitle: offer.title,
    offerSlug: offer.slug,
    branchName: branch.branchName,
    businessName: business.businessName,
    customerName: customer?.name,
  });
}

export async function listOwnerSaveCounts(ownerId: string) {
  if (isPreviewMode()) return previewSaveCounts(ownerId);
  await connectDB();
  const businessIds = await ownerBusinessIds(ownerId);
  const offers = await OfferModel.find({ businessId: { $in: businessIds }, status: { $ne: "archived" } })
    .select("title slug viewsCount status")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  const counts = await FavoriteModel.aggregate<{ _id: unknown; count: number }>([
    { $match: { offerId: { $in: offers.map((offer) => offer._id) } } },
    { $group: { _id: "$offerId", count: { $sum: 1 } } },
  ]);
  const totals = new Map(counts.map((row) => [String(row._id), row.count]));
  return offers.map((offer) => ({
    id: String(offer._id),
    title: offer.title,
    slug: offer.slug,
    status: offer.status,
    views: offer.viewsCount ?? 0,
    saves: totals.get(String(offer._id)) ?? 0,
  }));
}

export async function customerRedemptionCode(userId: string, offerId: string) {
  await connectDB();
  const doc = await RedemptionModel.findOne({
    userId,
    offerId: toObjectId(offerId, "Offer"),
    status: { $in: ["claimed", "redeemed"] },
  }).select("redemptionCode status");
  if (!doc) return null;
  return { redemptionCode: doc.redemptionCode, status: doc.status };
}

export async function listRedemptionsForUser(userId: string): Promise<RedemptionDTO[]> {
  if (isPreviewMode()) return previewRedemptionsForUser(userId);
  await connectDB();
  const docs = await RedemptionModel.find({ userId }).sort({ claimedAt: -1 }).lean();
  return hydrateRedemptions(docs, false);
}

export async function listRedemptionsForOwner(ownerId: string, page: number, limit: number): Promise<PageResult<RedemptionDTO>> {
  if (isPreviewMode()) return previewRedemptionsForOwner(ownerId, page, limit);
  const businessIds = await ownerBusinessIds(ownerId);
  const offers = await OfferModel.find({ businessId: { $in: businessIds } }).select("_id").lean();
  const filter = { offerId: { $in: offers.map((offer) => offer._id) } };
  const total = await RedemptionModel.countDocuments(filter);
  const docs = await RedemptionModel.find(filter).sort({ claimedAt: -1 }).skip((page - 1) * limit).limit(limit).lean();
  return {
    items: await hydrateRedemptions(docs, true),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function updateRedemption(ownerId: string, redemptionId: string, status: "redeemed" | "cancelled") {
  await connectDB();
  const redemption = await RedemptionModel.findById(toObjectId(redemptionId, "Redemption"));
  if (!redemption || redemption.status !== "claimed") {
    throw new AppError(404, "not_found", "That claimed redemption was not found.");
  }
  const offer = await OfferModel.findById(redemption.offerId);
  const business = offer ? await BusinessModel.findById(offer.businessId) : null;
  if (!offer || !business || String(business.ownerId) !== ownerId) {
    throw new AppError(404, "not_found", "That claimed redemption was not found.");
  }
  redemption.status = status;
  if (status === "redeemed") redemption.redeemedAt = new Date();
  await redemption.save();
  await logActivity({
    actorId: ownerId,
    action: status === "redeemed" ? "redemption.redeem" : "redemption.cancel",
    resourceType: "redemption",
    resourceId: String(redemption._id),
  });
  const [item] = await hydrateRedemptions([redemption.toObject()], true);
  return item;
}

async function hydrateRedemptions(
  docs: Array<{
    _id: unknown;
    userId: import("mongoose").Types.ObjectId;
    offerId: import("mongoose").Types.ObjectId;
    branchId: import("mongoose").Types.ObjectId;
    redemptionCode: string;
    status: RedemptionDTO["status"];
    claimedAt: Date;
    redeemedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
  }>,
  includeCustomer: boolean,
) {
  const [offers, branches, users] = await Promise.all([
    OfferModel.find({ _id: { $in: docs.map((doc) => doc.offerId) } }).lean() as Promise<import("@/models").OfferRecord[]>,
    BranchModel.find({ _id: { $in: docs.map((doc) => doc.branchId) } }).lean() as Promise<import("@/models").BranchRecord[]>,
    includeCustomer
      ? (UserModel.find({ _id: { $in: docs.map((doc) => doc.userId) } }).select("name").lean() as Promise<import("@/models").UserRecord[]>)
      : Promise.resolve([]),
  ]);
  const businesses = (await BusinessModel.find({ _id: { $in: offers.map((offer) => offer.businessId) } })
    .select("businessName")
    .lean()) as import("@/models").BusinessRecord[];
  const offerMap = new Map(offers.map((offer) => [String(offer._id), offer]));
  const branchMap = new Map(branches.map((branch) => [String(branch._id), branch]));
  const businessMap = new Map(businesses.map((business) => [String(business._id), business.businessName]));
  const userMap = new Map(users.map((user) => [String(user._id), user.name]));
  return docs.map((doc) => {
    const offer = offerMap.get(String(doc.offerId));
    const branch = branchMap.get(String(doc.branchId));
    return toRedemption(doc as never, {
      offerTitle: offer?.title || "Offer",
      offerSlug: offer?.slug || "",
      branchName: branch?.branchName || "Branch",
      businessName: offer ? businessMap.get(String(offer.businessId)) || "Business" : "Business",
      customerName: includeCustomer ? userMap.get(String(doc.userId)) : undefined,
    });
  });
}

export async function createReport(userId: string, input: { offerId: string; reason: ReportDTO["reason"]; description: string }) {
  await visibleOffer(input.offerId);
  const existing = await ReportModel.findOne({ userId, offerId: input.offerId, status: { $in: ["open", "reviewing"] } }).lean();
  if (existing) throw new AppError(409, "already_reported", "You already have an open report for this offer.");
  const doc = await ReportModel.create({
    userId,
    offerId: input.offerId,
    reason: input.reason,
    description: input.description.trim(),
    status: "open",
  });
  await logActivity({ actorId: userId, action: "report.create", resourceType: "report", resourceId: String(doc._id) });
  return toReport(doc.toObject());
}

export async function listReportsForOwner(ownerId: string, page: number, limit: number): Promise<PageResult<ReportDTO>> {
  if (isPreviewMode()) return previewReportsForOwner(ownerId, page, limit);
  const businessIds = await ownerBusinessIds(ownerId);
  const offers = await OfferModel.find({ businessId: { $in: businessIds } }).select("_id").lean();
  return listReports({ offerId: { $in: offers.map((offer) => offer._id) } }, page, limit);
}

export async function listReportsForAdmin(page: number, limit: number, status?: string): Promise<PageResult<ReportDTO>> {
  if (isPreviewMode()) return previewReportsForAdmin(page, limit, status);
  const filter = status && status !== "all" ? { status } : {};
  return listReports(filter, page, limit);
}

export async function updateReport(actorId: string, reportId: string, input: { status: ReportStatus; resolutionNote?: string }) {
  await connectDB();
  const report = await ReportModel.findById(toObjectId(reportId, "Report"));
  if (!report) throw new AppError(404, "not_found", "Report was not found.");
  report.status = input.status;
  report.resolutionNote = input.resolutionNote?.trim() || undefined;
  report.resolvedBy = toObjectId(actorId, "User");
  await report.save();
  await logActivity({
    actorId,
    action: "report.update",
    resourceType: "report",
    resourceId: String(report._id),
    metadata: { status: report.status },
  });
  const [item] = await hydrateReports([report.toObject()]);
  return item;
}

async function listReports(filter: Record<string, unknown>, page: number, limit: number): Promise<PageResult<ReportDTO>> {
  await connectDB();
  const total = await ReportModel.countDocuments(filter);
  const docs = await ReportModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean();
  return { items: await hydrateReports(docs), page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

async function hydrateReports(
  docs: Array<{
    _id: unknown;
    userId: import("mongoose").Types.ObjectId;
    offerId: import("mongoose").Types.ObjectId;
    reason: ReportDTO["reason"];
    description: string;
    status: ReportStatus;
    resolutionNote?: string;
    createdAt: Date;
    updatedAt: Date;
  }>,
) {
  const [users, offers] = await Promise.all([
    UserModel.find({ _id: { $in: docs.map((doc) => doc.userId) } }).select("name").lean() as Promise<import("@/models").UserRecord[]>,
    OfferModel.find({ _id: { $in: docs.map((doc) => doc.offerId) } }).lean() as Promise<import("@/models").OfferRecord[]>,
  ]);
  const businesses = (await BusinessModel.find({ _id: { $in: offers.map((offer) => offer.businessId) } })
    .select("businessName")
    .lean()) as import("@/models").BusinessRecord[];
  const userMap = new Map(users.map((user) => [String(user._id), user.name]));
  const offerMap = new Map(offers.map((offer) => [String(offer._id), offer]));
  const businessMap = new Map(businesses.map((business) => [String(business._id), business.businessName]));
  return docs.map((doc) => {
    const offer = offerMap.get(String(doc.offerId));
    return toReport(doc as never, {
      userName: userMap.get(String(doc.userId)),
      offerTitle: offer?.title,
      offerSlug: offer?.slug,
      businessName: offer ? businessMap.get(String(offer.businessId)) : undefined,
    });
  });
}
