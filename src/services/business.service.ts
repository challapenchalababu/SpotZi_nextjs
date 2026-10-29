import { previewAdminBranches, previewAdminBusinesses, previewBranchForOwner, previewBranchesForOwner, previewBusinessForOwner, previewOwnerBusinesses } from "@/data/preview-store";
import { connectDB } from "@/lib/db";
import { isPreviewMode } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { toPoint } from "@/lib/geo";
import { safeImageUrl, safeWebsiteUrl } from "@/lib/sanitize";
import { uniqueSlug } from "@/lib/ids";
import { slugify } from "@/lib/slug";
import { blank, toBranch, toBusiness } from "@/lib/serialize";
import { BranchModel, BusinessModel, CategoryModel, OfferModel } from "@/models";
import { requireOwnedBranch, requireOwnedBusiness, toObjectId } from "@/services/access";
import { logActivity } from "@/services/activity.service";
import type { BranchDTO, BusinessDTO, PageResult } from "@/types/domain";
import type { BranchInput, BusinessInput } from "@/validators";

async function categoryName(slug: string) {
  const category = await CategoryModel.findOne({ slug }).select("name").lean();
  return category?.name;
}

async function assertActiveCategory(slug: string) {
  const category = await CategoryModel.findOne({ slug, isActive: true }).lean();
  if (!category) throw new AppError(400, "invalid_category", "Choose an active category.");
  return category;
}

function cleanWebsite(value?: string) {
  const website = blank(value);
  if (!website) return undefined;
  const safe = safeWebsiteUrl(website);
  if (!safe) throw new AppError(400, "invalid_url", "Enter a valid website URL.");
  return safe;
}

function cleanImage(value?: string) {
  const image = blank(value);
  if (!image) return undefined;
  const safe = safeImageUrl(image);
  if (!safe) throw new AppError(400, "invalid_image", "Upload the image before saving it.");
  return safe;
}

export async function createBusiness(ownerId: string, input: BusinessInput): Promise<BusinessDTO> {
  await connectDB();
  const category = await assertActiveCategory(input.category);
  const business = await BusinessModel.create({
    ownerId,
    businessName: input.businessName.trim(),
    slug: await uniqueSlug(BusinessModel, "slug", input.businessName),
    category: category.slug,
    description: input.description.trim(),
    logoUrl: cleanImage(input.logoUrl),
    contactPhone: blank(input.contactPhone),
    website: cleanWebsite(input.website),
    isActive: input.isActive ?? true,
  });
  await logActivity({
    actorId: ownerId,
    action: "business.create",
    resourceType: "business",
    resourceId: String(business._id),
    metadata: { slug: business.slug },
  });
  return toBusiness(business.toObject(), { categoryName: category.name, branchCount: 0, offerCount: 0 });
}

export async function updateBusiness(ownerId: string, businessId: string, input: BusinessInput): Promise<BusinessDTO> {
  const business = await requireOwnedBusiness(ownerId, businessId);
  const category = await assertActiveCategory(input.category);
  business.businessName = input.businessName.trim();
  business.category = category.slug;
  business.description = input.description.trim();
  business.logoUrl = cleanImage(input.logoUrl);
  business.contactPhone = blank(input.contactPhone);
  business.website = cleanWebsite(input.website);
  if (input.isActive != null) business.isActive = input.isActive;
  await business.save();
  await logActivity({
    actorId: ownerId,
    action: "business.update",
    resourceType: "business",
    resourceId: String(business._id),
  });
  const [branchCount, offerCount] = await Promise.all([
    BranchModel.countDocuments({ businessId: business._id }),
    OfferModel.countDocuments({ businessId: business._id, status: { $ne: "archived" } }),
  ]);
  return toBusiness(business.toObject(), { categoryName: category.name, branchCount, offerCount });
}

export async function getBusinessForOwner(ownerId: string, businessId: string) {
  if (isPreviewMode()) {
    const business = previewBusinessForOwner(ownerId, businessId);
    if (!business) throw new AppError(404, "not_found", "Business was not found.");
    return business;
  }
  const business = await requireOwnedBusiness(ownerId, businessId);
  const name = await categoryName(business.category);
  return toBusiness(business.toObject(), { categoryName: name });
}

export async function listOwnerBusinesses(ownerId: string): Promise<BusinessDTO[]> {
  if (isPreviewMode()) return previewOwnerBusinesses(ownerId);
  await connectDB();
  const docs = await BusinessModel.find({ ownerId }).sort({ createdAt: -1 }).lean();
  return Promise.all(docs.map(async (doc) => toBusiness(doc, { categoryName: await categoryName(doc.category) })));
}

export async function listPublicBusinesses(input: {
  page: number;
  limit: number;
  q?: string;
  category?: string;
  city?: string;
}): Promise<PageResult<BusinessDTO>> {
  await connectDB();
  const filter: Record<string, unknown> = { isActive: true };
  if (input.category) filter.category = input.category;
  if (input.q) filter.businessName = new RegExp(input.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  if (input.city) {
    const branches = await BranchModel.find({ "address.citySlug": slugify(input.city), isActive: true }).select("businessId").lean();
    filter._id = { $in: branches.map((branch) => branch.businessId) };
  }
  const total = await BusinessModel.countDocuments(filter);
  const docs = await BusinessModel.find(filter)
    .sort({ businessName: 1 })
    .skip((input.page - 1) * input.limit)
    .limit(input.limit)
    .lean();
  const items = await Promise.all(docs.map(async (doc) => toBusiness(doc, { categoryName: await categoryName(doc.category) })));
  return { items, page: input.page, limit: input.limit, total, totalPages: Math.max(1, Math.ceil(total / input.limit)) };
}

export async function listAdminBusinesses(input: {
  page: number;
  limit: number;
  q?: string;
  category?: string;
  city?: string;
  isActive?: boolean;
}): Promise<PageResult<BusinessDTO>> {
  if (isPreviewMode()) return previewAdminBusinesses(input);
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (input.category) filter.category = input.category;
  if (input.isActive != null) filter.isActive = input.isActive;
  if (input.q) filter.businessName = new RegExp(input.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  if (input.city) {
    const branches = await BranchModel.find({ "address.citySlug": slugify(input.city) }).select("businessId").lean();
    filter._id = { $in: branches.map((branch) => branch.businessId) };
  }
  const total = await BusinessModel.countDocuments(filter);
  const docs = await BusinessModel.find(filter).sort({ createdAt: -1 }).skip((input.page - 1) * input.limit).limit(input.limit).lean();
  const items = await Promise.all(
    docs.map(async (doc) => {
      const [branchCount, offerCount, name] = await Promise.all([
        BranchModel.countDocuments({ businessId: doc._id }),
        OfferModel.countDocuments({ businessId: doc._id, status: { $ne: "archived" } }),
        categoryName(doc.category),
      ]);
      return toBusiness(doc, { categoryName: name, branchCount, offerCount });
    }),
  );
  return { items, page: input.page, limit: input.limit, total, totalPages: Math.max(1, Math.ceil(total / input.limit)) };
}

export async function setBusinessActive(actorId: string, businessId: string, isActive: boolean) {
  await connectDB();
  const business = await BusinessModel.findById(toObjectId(businessId, "Business"));
  if (!business) throw new AppError(404, "not_found", "Business was not found.");
  business.isActive = isActive;
  await business.save();
  await logActivity({
    actorId,
    action: isActive ? "business.enable" : "business.disable",
    resourceType: "business",
    resourceId: String(business._id),
  });
  return toBusiness(business.toObject(), { categoryName: await categoryName(business.category) });
}

export async function createBranch(ownerId: string, input: BranchInput): Promise<BranchDTO> {
  const business = await requireOwnedBusiness(ownerId, input.businessId);
  const branch = await BranchModel.create({
    businessId: business._id,
    branchName: input.branchName.trim(),
    address: {
      line1: input.address.line1.trim(),
      line2: blank(input.address.line2),
      area: input.address.area.trim(),
      city: input.address.city.trim(),
      citySlug: slugify(input.address.city),
      state: blank(input.address.state),
      pincode: input.address.pincode.trim(),
      country: input.address.country.trim(),
    },
    location: toPoint(input.longitude, input.latitude),
    openingHours: input.openingHours,
    phone: blank(input.phone),
    isActive: input.isActive ?? true,
  });
  await logActivity({
    actorId: ownerId,
    action: "branch.create",
    resourceType: "branch",
    resourceId: String(branch._id),
    metadata: { city: branch.address.city },
  });
  return toBranch(branch.toObject(), business.businessName);
}

export async function updateBranch(ownerId: string, branchId: string, input: BranchInput): Promise<BranchDTO> {
  const { branch, business } = await requireOwnedBranch(ownerId, branchId);
  if (String(business._id) !== input.businessId) {
    throw new AppError(400, "invalid_business", "A branch cannot be moved to another business.");
  }
  branch.branchName = input.branchName.trim();
  branch.address = {
    line1: input.address.line1.trim(),
    line2: blank(input.address.line2),
    area: input.address.area.trim(),
    city: input.address.city.trim(),
    citySlug: slugify(input.address.city),
    state: blank(input.address.state),
    pincode: input.address.pincode.trim(),
    country: input.address.country.trim(),
  };
  branch.location = toPoint(input.longitude, input.latitude);
  branch.openingHours = input.openingHours;
  branch.phone = blank(input.phone);
  if (input.isActive != null) branch.isActive = input.isActive;
  await branch.save();
  await OfferModel.updateMany({ branchId: branch._id }, { $set: { location: branch.location } });
  await logActivity({
    actorId: ownerId,
    action: "branch.update",
    resourceType: "branch",
    resourceId: String(branch._id),
  });
  return toBranch(branch.toObject(), business.businessName);
}

export async function listBranchesForOwner(ownerId: string, businessId?: string): Promise<BranchDTO[]> {
  if (isPreviewMode()) return previewBranchesForOwner(ownerId, businessId);
  await connectDB();
  const businesses = await BusinessModel.find(businessId ? { _id: toObjectId(businessId, "Business"), ownerId } : { ownerId }).lean();
  if (businessId && businesses.length === 0) throw new AppError(404, "not_found", "Business was not found.");
  const names = new Map(businesses.map((business) => [String(business._id), business.businessName]));
  const docs = await BranchModel.find({ businessId: { $in: businesses.map((business) => business._id) } })
    .sort({ createdAt: -1 })
    .lean();
  return docs.map((doc) => toBranch(doc, names.get(String(doc.businessId))));
}

export async function getBranchForOwner(ownerId: string, branchId: string) {
  if (isPreviewMode()) {
    const branch = previewBranchForOwner(ownerId, branchId);
    if (!branch) throw new AppError(404, "not_found", "Branch was not found.");
    return branch;
  }
  const { branch, business } = await requireOwnedBranch(ownerId, branchId);
  return toBranch(branch.toObject(), business.businessName);
}

export async function listAdminBranches(input: { page: number; limit: number; q?: string; city?: string; isActive?: boolean }) {
  if (isPreviewMode()) return previewAdminBranches(input);
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (input.city) filter["address.citySlug"] = slugify(input.city);
  if (input.isActive != null) filter.isActive = input.isActive;
  if (input.q) filter.branchName = new RegExp(input.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const total = await BranchModel.countDocuments(filter);
  const docs = await BranchModel.find(filter).sort({ createdAt: -1 }).skip((input.page - 1) * input.limit).limit(input.limit).lean();
  const businesses = await BusinessModel.find({ _id: { $in: docs.map((doc) => doc.businessId) } }).select("businessName").lean();
  const names = new Map(businesses.map((business) => [String(business._id), business.businessName]));
  return {
    items: docs.map((doc) => toBranch(doc, names.get(String(doc.businessId)))),
    page: input.page,
    limit: input.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / input.limit)),
  };
}

export async function setBranchActive(actorId: string, branchId: string, isActive: boolean) {
  await connectDB();
  const branch = await BranchModel.findById(toObjectId(branchId, "Branch"));
  if (!branch) throw new AppError(404, "not_found", "Branch was not found.");
  branch.isActive = isActive;
  await branch.save();
  await logActivity({
    actorId,
    action: isActive ? "branch.enable" : "branch.disable",
    resourceType: "branch",
    resourceId: String(branch._id),
  });
  return toBranch(branch.toObject());
}
