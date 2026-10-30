import { previewCities, previewManagedOffer, previewManagedOffers, previewNearby, previewOfferBySlug, previewPublicOffers, previewSitemap } from "@/data/preview-store";
import { connectDB } from "@/lib/db";
import { isPreviewMode } from "@/lib/env";
import { discountLabel, discountScore } from "@/lib/discount";
import { AppError } from "@/lib/errors";
import { normalizeOpeningHours } from "@/lib/hours";
import { randomSlugSuffix, uniqueSlug } from "@/lib/ids";
import { escapeRegex, slugify } from "@/lib/slug";
import { validateNearbyQuery } from "@/lib/geo";
import { availabilityOf, isWithinSchedule, isWithinValidityDates } from "@/lib/offer-validity";
import { safeImageUrl } from "@/lib/sanitize";
import { blank, toManagedOffer, toPublicOffer } from "@/lib/serialize";
import { dateInputToRange } from "@/lib/time";
import { Types } from "mongoose";
import {
  BranchModel,
  BusinessModel,
  CategoryModel,
  FavoriteModel,
  OfferModel,
  OfferTemplateModel,
  RedemptionModel,
  type BranchRecord,
  type BusinessRecord,
  type OfferRecord,
  type TemplateRecord,
} from "@/models";
import { ownerBusinessIds, requireOwnedBusiness, requireOwnedOffer, toObjectId } from "@/services/access";
import { logActivity } from "@/services/activity.service";
import type { ManagedOfferDTO, OfferStatus, PageResult, PublicOfferDTO, PublicStoreDTO } from "@/types/domain";
import type { CreateOfferInput, UpdateOfferInput } from "@/validators";

const SCAN_LIMIT = 300;

type OfferBundle = {
  offer: OfferRecord;
  business: BusinessRecord;
  branch: BranchRecord;
  template?: TemplateRecord | null;
  distanceKm?: number;
};

function emptyPage<T>(page: number, limit: number): PageResult<T> {
  return { items: [], page, limit, total: 0, totalPages: 1 };
}

function paginate<T>(items: T[], page: number, limit: number): PageResult<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  return { items: items.slice((safePage - 1) * limit, safePage * limit), page: safePage, limit, total, totalPages };
}

async function categoryNames() {
  const categories = await CategoryModel.find().select("name slug").lean();
  return new Map(categories.map((category) => [category.slug, category.name]));
}

function isRecord(value: unknown): value is BusinessRecord {
  return Boolean(value && typeof value === "object" && "businessName" in value);
}

function isBranch(value: unknown): value is BranchRecord {
  return Boolean(value && typeof value === "object" && "branchName" in value && "address" in value);
}

function isTemplate(value: unknown): value is TemplateRecord {
  return Boolean(value && typeof value === "object" && "layoutConfig" in value);
}

function bundleFromPopulated(doc: OfferRecord & {
  businessId: unknown;
  branchId: unknown;
  templateId?: unknown;
}): OfferBundle | null {
  if (!isRecord(doc.businessId) || !isBranch(doc.branchId)) return null;
  const template = isTemplate(doc.templateId) ? doc.templateId : null;
  return {
    offer: { ...doc, businessId: doc.businessId._id, branchId: doc.branchId._id, templateId: template?._id },
    business: doc.businessId,
    branch: doc.branchId,
    template,
  };
}

async function publicBundles(filter: Record<string, unknown>, sort: Record<string, 1 | -1> | { validUntil: 1 } | { viewsCount: -1; createdAt: -1 } | { createdAt: -1 }) {
  await connectDB();
  const docs = await OfferModel.find(filter)
    .sort(sort)
    .limit(SCAN_LIMIT)
    .populate("businessId")
    .populate("branchId")
    .populate("templateId")
    .lean();
  return docs
    .map((doc) => bundleFromPopulated(doc as never))
    .filter((bundle): bundle is OfferBundle => Boolean(bundle && bundle.business.isActive && bundle.branch.isActive));
}

function toPublic(bundle: OfferBundle, names: Map<string, string>, now = new Date()) {
  return toPublicOffer({
    ...bundle,
    categoryName: names.get(bundle.business.category),
    now,
  });
}

function toManaged(bundle: OfferBundle, names: Map<string, string>, counts?: { favorites?: number; redemptions?: number }) {
  return toManagedOffer({
    ...bundle,
    categoryName: names.get(bundle.business.category),
    favoriteCount: counts?.favorites,
    redemptionCount: counts?.redemptions,
  });
}

function offerPayload(input: CreateOfferInput | UpdateOfferInput, branch: BranchRecord) {
  const rangeStart = dateInputToRange(input.validFrom, input.timezone);
  const rangeEnd = dateInputToRange(input.validUntil, input.timezone);
  if (input.status === "published" && rangeEnd.end.getTime() < Date.now()) {
    throw new AppError(400, "expired_dates", "Choose an end date that has not already passed.");
  }
  const poster = blank(input.posterUrl);
  if (poster && !safeImageUrl(poster)) throw new AppError(400, "invalid_image", "Upload the poster before saving it.");
  const items = (input.items ?? [])
    .map((item, index) => {
      const itemPoster = blank(item.posterUrl);
      if (itemPoster && !safeImageUrl(itemPoster)) {
        throw new AppError(400, "invalid_image", "Upload each product poster before saving.");
      }
      return {
        name: item.name.trim(),
        originalPrice: item.originalPrice,
        discountedPrice: item.discountedPrice,
        discountPercent: item.discountPercent ?? item.discountValue,
        discountValue: item.discountValue ?? item.discountPercent,
        posterUrl: itemPoster,
        sortOrder: item.sortOrder ?? index,
      };
    })
    .filter((item) => item.name.length > 0);
  return {
    templateId: input.templateId,
    title: input.title.trim(),
    description: input.description.trim(),
    offerType: input.offerType,
    discountValue: input.discountValue,
    originalPrice: input.originalPrice,
    discountedPrice: input.discountedPrice,
    items,
    posterUrl: poster,
    validFrom: rangeStart.start,
    validUntil: rangeEnd.end,
    activeDays: input.activeDays,
    startTime: blank(input.startTime),
    endTime: blank(input.endTime),
    timezone: input.timezone,
    location: branch.location,
    status: input.status,
    termsAndConditions: blank(input.termsAndConditions),
    redemptionLimit: input.redemptionLimit,
  };
}

async function assertTemplate(templateId: string, publishing: boolean) {
  const template = await OfferTemplateModel.findById(toObjectId(templateId, "Template"));
  if (!template || (publishing && !template.isActive)) {
    throw new AppError(400, "invalid_template", "Choose an active promotional template.");
  }
  return template;
}

export async function createOffers(ownerId: string, input: CreateOfferInput): Promise<ManagedOfferDTO[]> {
  const business = await requireOwnedBusiness(ownerId, input.businessId);
  if (input.status === "published" && !business.isActive) {
    throw new AppError(400, "inactive_business", "Activate the business before publishing.");
  }
  const branches = await BranchModel.find({
    _id: { $in: input.branchIds.map((id) => toObjectId(id, "Branch")) },
    businessId: business._id,
  });
  if (branches.length !== new Set(input.branchIds).size) {
    throw new AppError(400, "invalid_branch", "Choose branches that belong to this business.");
  }
  if (input.status === "published" && branches.some((branch) => !branch.isActive)) {
    throw new AppError(400, "inactive_branch", "Publish offers only for active branches.");
  }
  const template = await assertTemplate(input.templateId, input.status === "published");
  const products = input.products?.length
    ? input.products
    : [
        {
          name: input.title.trim(),
          discountValue: input.discountValue,
          originalPrice: input.originalPrice,
          discountedPrice: input.discountedPrice,
          posterUrl: input.posterUrl || "",
        },
      ];
  if (branches.length * products.length > 60) {
    throw new AppError(400, "too_many_offers", "Too many branch and product combinations. Use fewer branches or products.");
  }

  const docs = [];
  for (const branch of branches) {
    for (const product of products) {
      const productName = product.name.trim();
      const title =
        products.length === 1 && productName.toLowerCase() === input.title.trim().toLowerCase()
          ? input.title.trim()
          : products.length === 1
            ? productName
            : `${input.title.trim()} · ${productName}`;
      const productPoster = blank(product.posterUrl);
      if (productPoster && !safeImageUrl(productPoster)) {
        throw new AppError(400, "invalid_image", "Upload each product poster before saving.");
      }
      const payload = offerPayload(
        {
          ...input,
          title,
          discountValue: product.discountValue,
          originalPrice: product.originalPrice,
          discountedPrice: product.discountedPrice,
          posterUrl: productPoster || "",
          items: [
            {
              name: productName,
              originalPrice: product.originalPrice,
              discountedPrice: product.discountedPrice,
              discountPercent: product.discountValue,
              discountValue: product.discountValue,
              posterUrl: productPoster || "",
              sortOrder: 0,
            },
          ],
        },
        branch,
      );
      docs.push({
        ...payload,
        businessId: business._id,
        branchId: branch._id,
        slug: `${slugify(title).slice(0, 50) || "offer"}-${randomSlugSuffix()}`,
        viewsCount: 0,
      });
    }
  }

  const created = await OfferModel.create(docs);
  await logActivity({
    actorId: ownerId,
    action: input.status === "published" ? "offer.publish" : "offer.create",
    resourceType: "offer",
    resourceId: String(created[0]?._id ?? ""),
    metadata: { count: created.length, products: products.length, business: business.slug },
  });
  const names = await categoryNames();
  return created.map((offer) =>
    toManaged(
      {
        offer: offer.toObject(),
        business: business.toObject(),
        branch: branches.find((branch) => String(branch._id) === String(offer.branchId))!,
        template: template.toObject(),
      },
      names,
    ),
  );
}

export async function updateOffer(ownerId: string, offerId: string, input: UpdateOfferInput): Promise<ManagedOfferDTO> {
  const { offer, business } = await requireOwnedOffer(ownerId, offerId);
  if (String(business._id) !== input.businessId) {
    throw new AppError(400, "invalid_business", "This offer belongs to a different business.");
  }
  const branch = await BranchModel.findOne({ _id: toObjectId(input.branchId, "Branch"), businessId: business._id });
  if (!branch) throw new AppError(400, "invalid_branch", "Choose a branch that belongs to this business.");
  if (input.status === "published" && (!business.isActive || !branch.isActive)) {
    throw new AppError(400, "inactive_branch", "Activate the business and branch before publishing.");
  }
  const template = await assertTemplate(input.templateId, input.status === "published");
  Object.assign(offer, offerPayload(input, branch), { branchId: branch._id });
  await offer.save();
  await logActivity({
    actorId: ownerId,
    action: input.status === "published" ? "offer.publish" : "offer.update",
    resourceType: "offer",
    resourceId: String(offer._id),
  });
  return toManaged({ offer: offer.toObject(), business: business.toObject(), branch: branch.toObject(), template: template.toObject() }, await categoryNames());
}

export async function setOfferStatus(actorId: string, offerId: string, status: OfferStatus, asAdmin = false) {
  await connectDB();
  const owned = asAdmin ? null : await requireOwnedOffer(actorId, offerId);
  const offer = owned?.offer ?? (await OfferModel.findById(toObjectId(offerId, "Offer")));
  if (!offer) throw new AppError(404, "not_found", "Offer was not found.");
  if (asAdmin && status !== "paused" && status !== "archived") {
    throw new AppError(403, "forbidden", "Administrators can pause or archive offers.");
  }
  if (status === "published") {
    const business = owned?.business ?? (await BusinessModel.findById(offer.businessId));
    const branch = owned?.branch ?? (await BranchModel.findById(offer.branchId));
    if (!business?.isActive || !branch?.isActive) {
      throw new AppError(400, "inactive_branch", "Activate the business and branch before publishing.");
    }
    if (offer.validUntil.getTime() < Date.now()) {
      throw new AppError(400, "expired_dates", "Update the end date before publishing this offer.");
    }
    if (!offer.termsAndConditions || offer.termsAndConditions.trim().length < 10) {
      throw new AppError(400, "validation_error", "Add terms and conditions before publishing.");
    }
  }
  offer.status = status;
  await offer.save();
  await logActivity({
    actorId,
    action: status === "published" ? "offer.publish" : status === "paused" ? "offer.pause" : status === "archived" ? "offer.archive" : "offer.update",
    resourceType: "offer",
    resourceId: String(offer._id),
  });
  return { id: String(offer._id), status: offer.status };
}

export async function archiveOffer(ownerId: string, offerId: string) {
  return setOfferStatus(ownerId, offerId, "archived");
}

async function ensureBranchSlug(branch: BranchRecord) {
  const id = String(branch._id);
  const idSuffix = id.slice(-8);
  const root = slugify(`${branch.branchName}-${branch.address.area}-${branch.address.city}`) || "store";
  const desired = `${root}-${idSuffix}`;
  // Always bind slug to this branch id so store cards never collide onto another store.
  if (branch.slug === desired) return branch.slug;
  try {
    await BranchModel.updateOne({ _id: branch._id }, { $set: { slug: desired } });
    branch.slug = desired;
    return desired;
  } catch {
    const fallback = await uniqueSlug(BranchModel, "slug", desired);
    await BranchModel.updateOne({ _id: branch._id }, { $set: { slug: fallback } });
    branch.slug = fallback;
    return fallback;
  }
}

function toStoreDto(input: {
  branch: BranchRecord;
  business: BusinessRecord;
  categoryName?: string;
  offerCount: number;
  itemCount: number;
  topOffer?: OfferRecord | null;
  distanceKm?: number;
}): PublicStoreDTO {
  const [longitude, latitude] = input.branch.location.coordinates;
  const id = String(input.branch._id);
  return {
    id,
    // Prefer stable id in public URLs; slug remains for readable links when present.
    slug: input.branch.slug || id,
    branchName: input.branch.branchName,
    address: input.branch.address,
    latitude,
    longitude,
    phone: input.branch.phone || undefined,
    openingHours: normalizeOpeningHours(input.branch.openingHours),
    offerCount: input.offerCount,
    itemCount: input.itemCount,
    topDiscountLabel: input.topOffer ? discountLabel(input.topOffer) : undefined,
    posterUrl: safeImageUrl(input.topOffer?.posterUrl) || safeImageUrl(input.business.logoUrl),
    distanceKm: input.distanceKm,
    business: {
      id: String(input.business._id),
      businessName: input.business.businessName,
      slug: input.business.slug,
      logoUrl: safeImageUrl(input.business.logoUrl),
      category: input.business.category,
      categoryName: input.categoryName,
      contactPhone: input.business.contactPhone || undefined,
      website: input.business.website || undefined,
    },
  };
}

export async function listPublicOffers(input: {
  page: number;
  limit: number;
  q?: string;
  category?: string;
  city?: string;
  area?: string;
  pincode?: string;
  businessSlug?: string;
  branchId?: string;
  branchSlug?: string;
  offerType?: CreateOfferInput["offerType"];
  discountMin?: number;
  sort?: "newest" | "discount" | "ending" | "views";
  currentlyAvailable?: boolean;
}): Promise<PageResult<PublicOfferDTO>> {
  if (isPreviewMode()) return previewPublicOffers(input);
  await connectDB();
  const now = new Date();
  const businessFilter: Record<string, unknown> = { isActive: true };
  if (input.category) businessFilter.category = input.category;
  if (input.businessSlug) businessFilter.slug = input.businessSlug;
  const businesses = await BusinessModel.find(businessFilter).lean();
  if (businesses.length === 0) return emptyPage(input.page, input.limit);
  const businessById = new Map(businesses.map((business) => [String(business._id), business]));
  const filter: Record<string, unknown> = {
    status: "published",
    validUntil: { $gte: now },
    businessId: { $in: businesses.map((business) => business._id) },
  };
  if (input.offerType) filter.offerType = input.offerType;
  if (input.branchId) {
    filter.branchId = toObjectId(input.branchId, "Branch");
  } else if (input.branchSlug) {
    const branch = await BranchModel.findOne({ slug: input.branchSlug, isActive: true }).select("_id").lean();
    if (!branch) return emptyPage(input.page, input.limit);
    filter.branchId = branch._id;
  } else if (input.city || input.area || input.pincode) {
    const branchFilter: Record<string, unknown> = { isActive: true };
    if (input.city) branchFilter["address.citySlug"] = slugify(input.city);
    if (input.area) branchFilter["address.area"] = new RegExp(escapeRegex(input.area), "i");
    if (input.pincode) branchFilter["address.pincode"] = input.pincode.trim();
    const branches = await BranchModel.find(branchFilter).select("_id").lean();
    if (branches.length === 0) return emptyPage(input.page, input.limit);
    filter.branchId = { $in: branches.map((branch) => branch._id) };
  }
  if (input.q) {
    const expression = new RegExp(escapeRegex(input.q), "i");
    const namedIds = businesses.filter((business) => expression.test(business.businessName)).map((business) => business._id);
    filter.$or = [{ title: expression }, { businessId: { $in: namedIds } }];
  }
  const sort =
    input.sort === "ending"
      ? { validUntil: 1 as const }
      : input.sort === "views"
        ? { viewsCount: -1 as const, createdAt: -1 as const }
        : { createdAt: -1 as const };
  let bundles = await publicBundles(filter, sort);
  bundles = bundles.filter((bundle) => businessById.has(String(bundle.business._id)));
  if (input.currentlyAvailable) bundles = bundles.filter((bundle) => isWithinSchedule(bundle.offer, now));
  if (input.discountMin != null) bundles = bundles.filter((bundle) => discountScore(bundle.offer) >= input.discountMin!);
  if (input.sort === "discount") bundles.sort((a, b) => discountScore(b.offer) - discountScore(a.offer));
  const names = await categoryNames();
  return paginate(bundles.map((bundle) => toPublic(bundle, names, now)), input.page, input.limit);
}

export async function listManagedOffers(input: {
  page: number;
  limit: number;
  ownerId?: string;
  q?: string;
  status?: string;
  category?: string;
}): Promise<PageResult<ManagedOfferDTO>> {
  if (isPreviewMode()) return previewManagedOffers(input);
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (input.ownerId) {
    const ids = await ownerBusinessIds(input.ownerId);
    filter.businessId = { $in: ids };
  }
  if (input.category) {
    const businesses = await BusinessModel.find({ category: input.category }).select("_id").lean();
    const allowed = new Set(businesses.map((business) => String(business._id)));
    const current = Array.isArray((filter.businessId as { $in?: unknown[] } | undefined)?.$in)
      ? ((filter.businessId as { $in: unknown[] }).$in).map(String)
      : null;
    const ids = (current ?? [...allowed]).filter((id) => allowed.has(id));
    filter.businessId = { $in: ids };
  }
  if (input.status === "expired") {
    filter.status = "published";
    filter.validUntil = { $lt: new Date() };
  } else if (input.status && input.status !== "all") {
    filter.status = input.status;
  }
  if (input.q) filter.title = new RegExp(escapeRegex(input.q), "i");
  const total = await OfferModel.countDocuments(filter);
  const docs = await OfferModel.find(filter)
    .sort({ createdAt: -1 })
    .skip((input.page - 1) * input.limit)
    .limit(input.limit)
    .populate("businessId")
    .populate("branchId")
    .populate("templateId")
    .lean();
  const names = await categoryNames();
  const items = docs
    .map((doc) => bundleFromPopulated(doc as never))
    .filter((bundle): bundle is OfferBundle => Boolean(bundle))
    .map((bundle) => toManaged(bundle, names));
  return { items, page: input.page, limit: input.limit, total, totalPages: Math.max(1, Math.ceil(total / input.limit)) };
}

export async function getPublicOfferBySlug(slug: string) {
  if (isPreviewMode()) return previewOfferBySlug(slug);
  await connectDB();
  const doc = await OfferModel.findOne({ slug }).populate("businessId").populate("branchId").populate("templateId").lean();
  const bundle = doc ? bundleFromPopulated(doc as never) : null;
  if (!bundle || bundle.offer.status !== "published" || !bundle.business.isActive || !bundle.branch.isActive) {
    return null;
  }
  const names = await categoryNames();
  const now = new Date();
  const sameBusiness = await OfferModel.find({
    _id: { $ne: bundle.offer._id },
    businessId: bundle.business._id,
    status: "published",
    validFrom: { $lte: now },
    validUntil: { $gte: now },
  })
    .limit(3)
    .populate("businessId")
    .populate("branchId")
    .populate("templateId")
    .lean();
  const related = sameBusiness
    .map((item) => bundleFromPopulated(item as never))
    .filter((item): item is OfferBundle => Boolean(item && item.business.isActive && item.branch.isActive))
    .filter((item) => isWithinValidityDates(item.offer, now))
    .map((item) => toPublic(item, names, now));
  return { offer: toPublic(bundle, names, now), related };
}

export async function getManagedOffer(offerId: string, ownerId?: string) {
  if (isPreviewMode()) {
    const offer = previewManagedOffer(offerId, ownerId);
    if (!offer) throw new AppError(404, "not_found", "Offer was not found.");
    return offer;
  }
  await connectDB();
  const doc = await OfferModel.findById(toObjectId(offerId, "Offer")).populate("businessId").populate("branchId").populate("templateId").lean();
  const bundle = doc ? bundleFromPopulated(doc as never) : null;
  if (!bundle) throw new AppError(404, "not_found", "Offer was not found.");
  if (ownerId && String(bundle.business.ownerId) !== ownerId) throw new AppError(404, "not_found", "Offer was not found.");
  const [favoriteCount, redemptionCount] = await Promise.all([
    FavoriteModel.countDocuments({ offerId: bundle.offer._id }),
    RedemptionModel.countDocuments({ offerId: bundle.offer._id, status: { $in: ["claimed", "redeemed"] } }),
  ]);
  return toManaged(bundle, await categoryNames(), { favorites: favoriteCount, redemptions: redemptionCount });
}

export async function findNearbyOffers(input: {
  lat: number;
  lng: number;
  radiusKm: number;
  page: number;
  limit: number;
  sort: "distance" | "newest" | "discount";
  category?: string;
  offerType?: CreateOfferInput["offerType"];
  q?: string;
}) {
  if (isPreviewMode()) return previewNearby(input);
  const geo = validateNearbyQuery(input);
  await connectDB();
  const now = new Date();
  const docs = await OfferModel.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: [geo.lng, geo.lat] },
        distanceField: "distanceMeters",
        maxDistance: geo.radiusKm * 1000,
        spherical: true,
        query: { status: "published", validUntil: { $gte: now } },
      },
    },
    { $limit: 100 },
    { $lookup: { from: "businesses", localField: "businessId", foreignField: "_id", as: "business" } },
    { $unwind: "$business" },
    { $lookup: { from: "branches", localField: "branchId", foreignField: "_id", as: "branch" } },
    { $unwind: "$branch" },
    { $lookup: { from: "offerTemplates", localField: "templateId", foreignField: "_id", as: "template" } },
    { $unwind: { path: "$template", preserveNullAndEmptyArrays: true } },
    { $match: { "business.isActive": true, "branch.isActive": true } },
  ]);
  let bundles: OfferBundle[] = docs.map((doc) => ({
    offer: doc as OfferRecord,
    business: doc.business as BusinessRecord,
    branch: doc.branch as BranchRecord,
    template: doc.template as TemplateRecord | null,
    distanceKm: Math.round((Number(doc.distanceMeters) / 1000) * 10) / 10,
  }));
  bundles = bundles.filter((bundle) => {
    const availability = availabilityOf(bundle.offer, now);
    return availability === "active" || availability === "scheduled";
  });
  if (input.category) bundles = bundles.filter((bundle) => bundle.business.category === input.category);
  if (input.offerType) bundles = bundles.filter((bundle) => bundle.offer.offerType === input.offerType);
  if (input.q) {
    const query = input.q.toLowerCase();
    bundles = bundles.filter(
      (bundle) => bundle.offer.title.toLowerCase().includes(query) || bundle.business.businessName.toLowerCase().includes(query),
    );
  }
  if (input.sort === "newest") bundles.sort((a, b) => +new Date(b.offer.createdAt) - +new Date(a.offer.createdAt));
  if (input.sort === "discount") bundles.sort((a, b) => discountScore(b.offer) - discountScore(a.offer));
  const names = await categoryNames();
  return paginate(bundles.map((bundle) => toPublic(bundle, names, now)), input.page, input.limit);
}

export async function incrementOfferView(offerId: string) {
  await connectDB();
  await OfferModel.updateOne({ _id: offerId, status: "published" }, { $inc: { viewsCount: 1 } });
}

export async function findNearbyStores(input: {
  lat: number;
  lng: number;
  radiusKm: number;
  page: number;
  limit: number;
  q?: string;
  category?: string;
}): Promise<PageResult<PublicStoreDTO>> {
  if (isPreviewMode()) return emptyPage(input.page, input.limit);
  const geo = validateNearbyQuery(input);
  await connectDB();
  const now = new Date();
  const docs = await BranchModel.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: [geo.lng, geo.lat] },
        distanceField: "distanceMeters",
        maxDistance: geo.radiusKm * 1000,
        spherical: true,
        query: { isActive: true },
      },
    },
    { $limit: 80 },
    { $lookup: { from: "businesses", localField: "businessId", foreignField: "_id", as: "business" } },
    { $unwind: "$business" },
    { $match: { "business.isActive": true } },
    {
      $lookup: {
        from: "offers",
        let: { branchId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$branchId", "$$branchId"] },
              status: "published",
              validUntil: { $gte: now },
            },
          },
          { $sort: { createdAt: -1 } },
        ],
        as: "offers",
      },
    },
    { $match: { "offers.0": { $exists: true } } },
  ]);

  const names = await categoryNames();
  let stores: PublicStoreDTO[] = [];
  for (const doc of docs) {
    const branch = doc as BranchRecord & { distanceMeters?: number; offers?: OfferRecord[]; business: BusinessRecord };
    if (input.category && branch.business.category !== input.category) continue;
    if (input.q) {
      const query = input.q.toLowerCase();
      const haystack = `${branch.branchName} ${branch.business.businessName} ${branch.address.area} ${branch.address.city}`.toLowerCase();
      if (!haystack.includes(query)) continue;
    }
    await ensureBranchSlug(branch);
    const offers = (branch.offers ?? []).filter((offer) => {
      const availability = availabilityOf(offer, now);
      return availability === "active" || availability === "scheduled";
    });
    if (!offers.length) continue;
    const topOffer = [...offers].sort((a, b) => discountScore(b) - discountScore(a))[0];
    const itemCount = offers.reduce((sum, offer) => sum + (offer.items?.length || 0), 0);
    stores.push(
      toStoreDto({
        branch,
        business: branch.business,
        categoryName: names.get(branch.business.category),
        offerCount: offers.length,
        itemCount,
        topOffer,
        distanceKm: Math.round((Number(branch.distanceMeters) / 1000) * 10) / 10,
      }),
    );
  }

  return paginate(stores, input.page, input.limit);
}

export async function listPublicStores(input: {
  page: number;
  limit: number;
  q?: string;
  category?: string;
  city?: string;
}): Promise<PageResult<PublicStoreDTO>> {
  if (isPreviewMode()) return emptyPage(input.page, input.limit);
  await connectDB();
  const now = new Date();
  const businessFilter: Record<string, unknown> = { isActive: true };
  if (input.category) businessFilter.category = input.category;
  const businesses = await BusinessModel.find(businessFilter).lean();
  if (!businesses.length) return emptyPage(input.page, input.limit);
  const businessById = new Map(businesses.map((business) => [String(business._id), business]));
  const branchFilter: Record<string, unknown> = {
    isActive: true,
    businessId: { $in: businesses.map((business) => business._id) },
  };
  if (input.city) branchFilter["address.citySlug"] = slugify(input.city);
  if (input.q) {
    const expression = new RegExp(escapeRegex(input.q), "i");
    branchFilter.$or = [{ branchName: expression }, { "address.area": expression }, { "address.city": expression }];
  }
  const branches = await BranchModel.find(branchFilter).sort({ createdAt: -1 }).limit(200).lean();
  const offers = await OfferModel.find({
    branchId: { $in: branches.map((branch) => branch._id) },
    status: "published",
    validUntil: { $gte: now },
  })
    .sort({ createdAt: -1 })
    .lean();
  const offersByBranch = new Map<string, OfferRecord[]>();
  for (const offer of offers) {
    const key = String(offer.branchId);
    const list = offersByBranch.get(key) || [];
    list.push(offer);
    offersByBranch.set(key, list);
  }
  const names = await categoryNames();
  const stores: PublicStoreDTO[] = [];
  for (const branch of branches) {
    const business = businessById.get(String(branch.businessId));
    if (!business) continue;
    const branchOffers = (offersByBranch.get(String(branch._id)) || []).filter((offer) => {
      const availability = availabilityOf(offer, now);
      return availability === "active" || availability === "scheduled";
    });
    if (!branchOffers.length) continue;
    if (input.q) {
      const query = input.q.toLowerCase();
      if (!business.businessName.toLowerCase().includes(query) && !branch.branchName.toLowerCase().includes(query)) {
        // keep if branch filter already matched area/city
      }
    }
    await ensureBranchSlug(branch);
    const topOffer = [...branchOffers].sort((a, b) => discountScore(b) - discountScore(a))[0];
    stores.push(
      toStoreDto({
        branch,
        business,
        categoryName: names.get(business.category),
        offerCount: branchOffers.length,
        itemCount: branchOffers.reduce((sum, offer) => sum + (offer.items?.length || 0), 0),
        topOffer,
      }),
    );
  }
  return paginate(stores, input.page, input.limit);
}

export async function getPublicStoreBySlug(slug: string) {
  if (isPreviewMode()) return null;
  await connectDB();
  const byId = Types.ObjectId.isValid(slug) ? await BranchModel.findOne({ _id: slug, isActive: true }).lean() : null;
  const branch = byId || (await BranchModel.findOne({ slug, isActive: true }).lean());
  if (!branch) return null;
  await ensureBranchSlug(branch);
  const business = await BusinessModel.findOne({ _id: branch.businessId, isActive: true }).lean();
  if (!business) return null;
  // Load offers by branch id (never by a shared/colliding slug).
  const offers = await listPublicOffers({ page: 1, limit: 50, branchId: String(branch._id), sort: "newest" });
  const names = await categoryNames();
  const store = toStoreDto({
    branch,
    business,
    categoryName: names.get(business.category),
    offerCount: offers.total,
    itemCount: offers.items.reduce((sum, offer) => sum + (offer.items?.length || 0), 0),
    topOffer: null,
    distanceKm: undefined,
  });
  if (offers.items[0]) {
    store.topDiscountLabel = offers.items[0].discountLabel;
    store.posterUrl = offers.items[0].posterUrl || store.posterUrl;
  }
  return { store, offers: offers.items };
}

export async function listSitemapEntries() {
  if (isPreviewMode()) return previewSitemap();
  await connectDB();
  const now = new Date();
  const offers = await OfferModel.find({ status: "published", validFrom: { $lte: now }, validUntil: { $gte: now } })
    .select("slug updatedAt businessId")
    .limit(5000)
    .lean();
  const businesses = await BusinessModel.find({ _id: { $in: offers.map((offer) => offer.businessId) }, isActive: true })
    .select("slug category updatedAt")
    .lean();
  const activeBusinessIds = new Set(businesses.map((business) => String(business._id)));
  return {
    offers: offers.filter((offer) => activeBusinessIds.has(String(offer.businessId))).map((offer) => ({ slug: offer.slug, updatedAt: offer.updatedAt })),
    businesses: businesses.map((business) => ({ slug: business.slug, updatedAt: business.updatedAt })),
    categories: [...new Set(businesses.map((business) => business.category))],
    cities: await listOfferCities(),
  };
}

export async function listOfferCities() {
  if (isPreviewMode()) return previewCities();
  await connectDB();
  const now = new Date();
  const offers = await OfferModel.find({ status: "published", validFrom: { $lte: now }, validUntil: { $gte: now } }).select("branchId").lean();
  const branches = await BranchModel.find({ _id: { $in: offers.map((offer) => offer.branchId) }, isActive: true }).select("address").lean();
  const cities = new Map<string, string>();
  for (const branch of branches) cities.set(branch.address.citySlug, branch.address.city);
  return [...cities.entries()].map(([slug, name]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name));
}
