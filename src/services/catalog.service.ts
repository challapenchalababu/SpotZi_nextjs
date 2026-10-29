import { cache } from "react";
import { previewBusinessProfile, previewCategories, previewCategoryBySlug, previewHome, previewSettings, previewTemplate, previewTemplates } from "@/data/preview-store";
import { imageStorageMode, isPreviewMode, isSmtpConfigured } from "@/lib/env";
import { connectDB } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { maxSearchRadiusKm } from "@/lib/geo";
import { safeImageUrl } from "@/lib/sanitize";
import { blank, toBranch, toBusiness, toCategory, toTemplate } from "@/lib/serialize";
import { uniqueSlug } from "@/lib/ids";
import { slugify } from "@/lib/slug";
import {
  BranchModel,
  BusinessModel,
  CategoryModel,
  OfferModel,
  OfferTemplateModel,
  PlatformSettingsModel,
} from "@/models";
import { logActivity } from "@/services/activity.service";
import { listPublicOffers } from "@/services/offer.service";
import type { BusinessCard, CategoryDTO, HomePayload, PlatformSettingsDTO, TemplateDTO } from "@/types/domain";
import type { CategoryInput, SettingsInput, TemplateInput } from "@/validators";

export const getPlatformSettings = cache(async (): Promise<PlatformSettingsDTO> => {
  if (isPreviewMode()) return previewSettings();
  await connectDB();
  const doc = await PlatformSettingsModel.findById("platform").lean();
  const maxRadiusKm = maxSearchRadiusKm();
  return {
    supportEmail: doc?.supportEmail || "",
    defaultRadiusKm: Math.min(doc?.defaultRadiusKm || 5, maxRadiusKm),
    maxRadiusKm,
    imageStorage: imageStorageMode(),
    emailDelivery: isSmtpConfigured() ? "smtp" : "unconfigured",
  };
});

export async function updatePlatformSettings(actorId: string, input: SettingsInput): Promise<PlatformSettingsDTO> {
  await connectDB();
  const maxRadiusKm = maxSearchRadiusKm();
  if (input.defaultRadiusKm > maxRadiusKm) {
    throw new AppError(400, "invalid_radius", `The default radius cannot exceed ${maxRadiusKm} km.`);
  }
  await PlatformSettingsModel.findByIdAndUpdate(
    "platform",
    { supportEmail: input.supportEmail.trim(), defaultRadiusKm: input.defaultRadiusKm },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  await logActivity({ actorId, action: "settings.update", resourceType: "settings", resourceId: "platform" });
  return getPlatformSettings();
}

export const listCategories = cache(async (includeInactive = false): Promise<CategoryDTO[]> => {
  if (isPreviewMode()) return previewCategories(includeInactive);
  await connectDB();
  const docs = await CategoryModel.find(includeInactive ? {} : { isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
  return docs.map(toCategory);
});

export async function getCategoryBySlug(slug: string) {
  if (isPreviewMode()) return previewCategoryBySlug(slug);
  await connectDB();
  const doc = await CategoryModel.findOne({ slug, isActive: true }).lean();
  return doc ? toCategory(doc) : null;
}

export async function createCategory(actorId: string, input: CategoryInput) {
  await connectDB();
  const category = await CategoryModel.create({
    name: input.name.trim(),
    slug: await uniqueSlug(CategoryModel, "slug", input.name),
    icon: input.icon,
    description: input.description.trim(),
    isActive: input.isActive,
    sortOrder: input.sortOrder,
  });
  await logActivity({ actorId, action: "category.create", resourceType: "category", resourceId: String(category._id) });
  return toCategory(category.toObject());
}

export async function updateCategory(actorId: string, categoryId: string, input: CategoryInput) {
  await connectDB();
  const category = await CategoryModel.findById(categoryId);
  if (!category) throw new AppError(404, "not_found", "Category was not found.");
  category.name = input.name.trim();
  category.icon = input.icon;
  category.description = input.description.trim();
  category.isActive = input.isActive;
  category.sortOrder = input.sortOrder;
  await category.save();
  await logActivity({ actorId, action: "category.update", resourceType: "category", resourceId: String(category._id) });
  return toCategory(category.toObject());
}

export async function listTemplates(includeInactive = false): Promise<TemplateDTO[]> {
  if (isPreviewMode()) return previewTemplates(includeInactive);
  await connectDB();
  const docs = await OfferTemplateModel.find(includeInactive ? {} : { isActive: true }).sort({ createdAt: -1 }).lean();
  return docs.map(toTemplate);
}

export async function getTemplate(id: string, includeInactive = false) {
  if (isPreviewMode()) return previewTemplate(id);
  await connectDB();
  const doc = await OfferTemplateModel.findById(id).lean();
  if (!doc || (!includeInactive && !doc.isActive)) return null;
  return toTemplate(doc);
}

export async function createTemplate(actorId: string, input: TemplateInput) {
  await connectDB();
  const doc = await OfferTemplateModel.create({
    name: input.name.trim(),
    category: slugify(input.category) || "all",
    thumbnailUrl: cleanImage(input.thumbnailUrl),
    backgroundUrl: cleanImage(input.backgroundUrl),
    layoutConfig: input.layoutConfig,
    availableFields: input.availableFields,
    isActive: input.isActive,
    createdBy: actorId,
  });
  await logActivity({ actorId, action: "template.create", resourceType: "template", resourceId: String(doc._id) });
  return toTemplate(doc.toObject());
}

export async function updateTemplate(actorId: string, templateId: string, input: TemplateInput) {
  await connectDB();
  const doc = await OfferTemplateModel.findById(templateId);
  if (!doc) throw new AppError(404, "not_found", "Template was not found.");
  doc.name = input.name.trim();
  doc.category = slugify(input.category) || "all";
  doc.thumbnailUrl = cleanImage(input.thumbnailUrl);
  doc.backgroundUrl = cleanImage(input.backgroundUrl);
  doc.layoutConfig = input.layoutConfig;
  doc.availableFields = input.availableFields;
  doc.isActive = input.isActive;
  await doc.save();
  await logActivity({ actorId, action: "template.update", resourceType: "template", resourceId: String(doc._id) });
  return toTemplate(doc.toObject());
}

function cleanImage(value?: string) {
  const image = blank(value);
  if (!image) return undefined;
  const safe = safeImageUrl(image);
  if (!safe) throw new AppError(400, "invalid_image", "Upload the image before saving it.");
  return safe;
}

export async function getHomeData(): Promise<HomePayload> {
  if (isPreviewMode()) return previewHome();
  const [categories, featured, expiring, recent, popularBusinesses, settings] = await Promise.all([
    listCategories(false),
    listPublicOffers({ page: 1, limit: 8, sort: "views" }),
    expiringOffers(),
    listPublicOffers({ page: 1, limit: 8, sort: "newest" }),
    loadPopularBusinesses(),
    getPlatformSettings(),
  ]);
  return {
    categories,
    featured: featured.items,
    expiring,
    recent: recent.items,
    popularBusinesses,
    settings,
  };
}

async function expiringOffers() {
  await connectDB();
  const now = new Date();
  const soon = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const docs = await OfferModel.find({ status: "published", validFrom: { $lte: now }, validUntil: { $gte: now, $lte: soon } }).select("slug").lean();
  if (docs.length === 0) return [];
  const page = await listPublicOffers({ page: 1, limit: 24, sort: "ending" });
  const ids = new Set(docs.map((doc) => doc.slug));
  return page.items.filter((item) => ids.has(item.slug)).slice(0, 8);
}

async function loadPopularBusinesses(): Promise<BusinessCard[]> {
  await connectDB();
  const now = new Date();
  const grouped = await OfferModel.aggregate<{ _id: unknown; offerCount: number; views: number }>([
    { $match: { status: "published", validFrom: { $lte: now }, validUntil: { $gte: now } } },
    { $group: { _id: "$businessId", offerCount: { $sum: 1 }, views: { $sum: "$viewsCount" } } },
    { $sort: { views: -1, offerCount: -1 } },
    { $limit: 6 },
  ]);
  const businesses = (await BusinessModel.find({
    _id: { $in: grouped.map((row) => row._id as import("mongoose").Types.ObjectId) },
    isActive: true,
  }).lean()) as import("@/models").BusinessRecord[];
  const categories = await CategoryModel.find().select("slug name").lean();
  const names = new Map(categories.map((category) => [category.slug, category.name]));
  const order = new Map(grouped.map((row, index) => [String(row._id), index]));
  return businesses
    .map((business) => {
      const card = toBusiness(business, {
        categoryName: names.get(business.category),
        offerCount: grouped.find((row) => String(row._id) === String(business._id))?.offerCount,
      });
      return card;
    })
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

export async function getBusinessProfile(slug: string) {
  if (isPreviewMode()) return previewBusinessProfile(slug);
  await connectDB();
  const business = await BusinessModel.findOne({ slug, isActive: true }).lean();
  if (!business) return null;
  const [branches, offers, category] = await Promise.all([
    BranchModel.find({ businessId: business._id, isActive: true }).lean(),
    listPublicOffers({ page: 1, limit: 24, businessSlug: slug }),
    CategoryModel.findOne({ slug: business.category }).lean(),
  ]);
  return {
    business: toBusiness(business, { categoryName: category?.name, branchCount: branches.length, offerCount: offers.total }),
    branches: branches.map((branch) => toBranch(branch, business.businessName)),
    offers: offers.items,
  };
}

export async function categoryHasOffers(slug: string) {
  const page = await listPublicOffers({ page: 1, limit: 1, category: slug });
  return page.total > 0;
}
