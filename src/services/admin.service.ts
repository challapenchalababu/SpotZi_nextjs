import { previewAdminStats, previewOwnerStats, previewRecentUsers, previewUser, previewUsers } from "@/data/preview-store";
import { connectDB } from "@/lib/db";
import { isPreviewMode } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { escapeRegex } from "@/lib/slug";
import { toUser } from "@/lib/serialize";
import { BranchModel, BusinessModel, FavoriteModel, OfferModel, RedemptionModel, ReportModel, UserModel } from "@/models";
import { toObjectId } from "@/services/access";
import { logActivity } from "@/services/activity.service";
import type { AdminStats, OwnerStats, PageResult, UserDTO } from "@/types/domain";

export async function adminStats(): Promise<AdminStats> {
  if (isPreviewMode()) return previewAdminStats();
  await connectDB();
  const now = new Date();
  const [customers, owners, businesses, branches, offers, activeOffers, expiredOffers, redemptions, openReports] = await Promise.all([
    UserModel.countDocuments({ role: "customer" }),
    UserModel.countDocuments({ role: "owner" }),
    BusinessModel.countDocuments(),
    BranchModel.countDocuments(),
    OfferModel.countDocuments({ status: { $ne: "archived" } }),
    OfferModel.countDocuments({ status: "published", validFrom: { $lte: now }, validUntil: { $gte: now } }),
    OfferModel.countDocuments({ status: "published", validUntil: { $lt: now } }),
    RedemptionModel.countDocuments({ status: { $in: ["claimed", "redeemed"] } }),
    ReportModel.countDocuments({ status: { $in: ["open", "reviewing"] } }),
  ]);
  return { customers, owners, businesses, branches, offers, activeOffers, expiredOffers, redemptions, openReports };
}

export async function ownerStats(ownerId: string): Promise<OwnerStats> {
  if (isPreviewMode()) return previewOwnerStats(ownerId);
  await connectDB();
  const businesses = await BusinessModel.find({ ownerId }).select("_id");
  const businessIds = businesses.map((business) => business._id);
  const now = new Date();
  const offerFilter = { businessId: { $in: businessIds } };
  const offers = await OfferModel.find(offerFilter).select("_id status validFrom validUntil viewsCount");
  const offerIds = offers.map((offer) => offer._id);
  const [branches, favorites, redemptions, openReports] = await Promise.all([
    BranchModel.countDocuments({ businessId: { $in: businessIds } }),
    FavoriteModel.countDocuments({ offerId: { $in: offerIds } }),
    RedemptionModel.countDocuments({ offerId: { $in: offerIds }, status: { $in: ["claimed", "redeemed"] } }),
    ReportModel.countDocuments({ offerId: { $in: offerIds }, status: { $in: ["open", "reviewing"] } }),
  ]);
  return {
    businesses: businesses.length,
    branches,
    offers: offers.filter((offer) => offer.status !== "archived").length,
    activeOffers: offers.filter((offer) => offer.status === "published" && offer.validFrom <= now && offer.validUntil >= now).length,
    draftOffers: offers.filter((offer) => offer.status === "draft").length,
    expiredOffers: offers.filter((offer) => offer.status === "published" && offer.validUntil < now).length,
    views: offers.reduce((sum, offer) => sum + (offer.viewsCount || 0), 0),
    favorites,
    redemptions,
    openReports,
  };
}

export async function listUsers(input: {
  page: number;
  limit: number;
  q?: string;
  role?: "customer" | "owner" | "super_admin";
  isActive?: boolean;
}): Promise<PageResult<UserDTO>> {
  if (isPreviewMode()) return previewUsers(input);
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (input.role) filter.role = input.role;
  if (input.isActive != null) filter.isActive = input.isActive;
  if (input.q) {
    const expression = new RegExp(escapeRegex(input.q), "i");
    filter.$or = [{ name: expression }, { email: expression }];
  }
  const total = await UserModel.countDocuments(filter);
  const docs = await UserModel.find(filter).sort({ createdAt: -1 }).skip((input.page - 1) * input.limit).limit(input.limit).lean();
  const counts = await BusinessModel.aggregate<{ _id: unknown; count: number }>([
    { $match: { ownerId: { $in: docs.map((doc) => doc._id) } } },
    { $group: { _id: "$ownerId", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((row) => [String(row._id), row.count]));
  return {
    items: docs.map((doc) => toUser(doc, countMap.get(String(doc._id)) ?? 0)),
    page: input.page,
    limit: input.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / input.limit)),
  };
}

export async function setUserActive(actorId: string, userId: string, isActive: boolean) {
  await connectDB();
  if (actorId === userId && !isActive) {
    throw new AppError(400, "invalid_action", "You cannot disable your own account.");
  }
  const user = await UserModel.findById(toObjectId(userId, "User"));
  if (!user) throw new AppError(404, "not_found", "User was not found.");
  if (!isActive && user.role === "super_admin") {
    const remaining = await UserModel.countDocuments({ role: "super_admin", isActive: true, _id: { $ne: user._id } });
    if (remaining === 0) throw new AppError(400, "last_admin", "Keep at least one active super admin.");
  }
  user.isActive = isActive;
  await user.save();
  await logActivity({
    actorId,
    action: isActive ? "user.enable" : "user.disable",
    resourceType: "user",
    resourceId: String(user._id),
    metadata: { role: user.role },
  });
  return toUser(user.toObject());
}

export async function getAdminUser(userId: string) {
  if (isPreviewMode()) return previewUser(userId);
  await connectDB();
  const user = await UserModel.findById(toObjectId(userId, "User")).lean();
  if (!user) return null;
  const businessCount = user.role === "owner" ? await BusinessModel.countDocuments({ ownerId: user._id }) : 0;
  return toUser(user, businessCount);
}

export async function recentRegistrations(limit = 6) {
  if (isPreviewMode()) return previewRecentUsers(limit);
  await connectDB();
  const docs = await UserModel.find().sort({ createdAt: -1 }).limit(limit).lean();
  return docs.map((doc) => toUser(doc));
}
