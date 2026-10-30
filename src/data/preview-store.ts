import raw from "@/data/preview.json";
import { discountLabel, discountScore } from "@/lib/discount";
import { validateNearbyQuery } from "@/lib/geo";
import { availabilityOf, isWithinSchedule } from "@/lib/offer-validity";
import { escapeRegex, slugify } from "@/lib/slug";
import { dateInputToRange, shiftDateKey } from "@/lib/time";
import type {
  ActivityDTO,
  Address,
  Availability,
  BranchDTO,
  BusinessDTO,
  CategoryDTO,
  FavoriteDTO,
  HomePayload,
  LayoutConfig,
  ManagedOfferDTO,
  OfferStatus,
  OfferType,
  OpeningHours,
  PageResult,
  PosterLayout,
  PublicOfferDTO,
  RedemptionDTO,
  ReportDTO,
  ReportReason,
  ReportStatus,
  SessionUser,
  TemplateDTO,
  UserDTO,
  UserRole,
  Weekday,
} from "@/types/domain";

const ZONE = "Asia/Kolkata";

interface PreviewFile {
  settings: { supportEmail: string; defaultRadiusKm: number };
  categories: CategoryDTO[];
  users: Array<{ id: string; name: string; email: string; phone?: string; role: UserRole; isActive: boolean; createdDaysAgo: number }>;
  businesses: Array<{ id: string; ownerId: string; businessName: string; slug: string; category: string; description: string; contactPhone?: string; website?: string; isActive: boolean; updatedDaysAgo: number }>;
  branches: Array<{ id: string; businessId: string; branchName: string; line1: string; line2?: string; area: string; city: string; citySlug: string; state?: string; pincode: string; lng: number; lat: number; phone?: string; isActive: boolean; sundayClosed?: boolean }>;
  templates: Array<{ id: string; name: string; layout: PosterLayout; backgroundColor: string; textColor: string; accentColor: string; mutedColor: string; fontFamily: "sans" | "serif" }>;
  offers: Array<{ id: string; slug: string; title: string; description: string; businessId: string; branchId: string; templateId: string; offerType: OfferType; discountValue?: number; originalPrice?: number; discountedPrice?: number; status: OfferStatus; fromOffset: number; untilOffset: number; createdDaysAgo: number; viewsCount: number; terms: string; activeDays?: Weekday[]; startTime?: string; endTime?: string }>;
  favorites: Array<{ id: string; userId: string; offerId: string; createdDaysAgo: number }>;
  redemptions: Array<{ id: string; userId: string; offerId: string; code: string; status: RedemptionDTO["status"]; claimedDaysAgo: number; redeemedDaysAgo?: number }>;
  reports: Array<{ id: string; userId: string; offerId: string; reason: ReportReason; description: string; status: ReportStatus; createdDaysAgo: number; resolutionNote?: string }>;
  activity: Array<{ id: string; actorId: string; action: string; resourceType: string; resourceId: string; hoursAgo: number }>;
}

const data = raw as PreviewFile;

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function hours(sundayClosed = false): OpeningHours {
  const open = { closed: false, open: "09:00", close: "21:00" };
  const day = () => ({ ...open });
  return {
    monday: day(),
    tuesday: day(),
    wednesday: day(),
    thursday: day(),
    friday: day(),
    saturday: day(),
    sunday: sundayClosed ? { closed: true, open: "09:00", close: "21:00" } : day(),
  };
}

function addressOf(branch: PreviewFile["branches"][number]): Address {
  return {
    line1: branch.line1,
    line2: branch.line2,
    area: branch.area,
    city: branch.city,
    citySlug: branch.citySlug,
    state: branch.state,
    pincode: branch.pincode,
    country: "India",
  };
}

function categoryName(slug: string) {
  return data.categories.find((category) => category.slug === slug)?.name;
}

function layoutOf(template: PreviewFile["templates"][number]): LayoutConfig {
  return {
    layout: template.layout,
    backgroundColor: template.backgroundColor,
    textColor: template.textColor,
    accentColor: template.accentColor,
    mutedColor: template.mutedColor,
    fontFamily: template.fontFamily,
    logoPosition: "top-left",
    showAddress: true,
    showValidity: true,
    showPrices: true,
  };
}

function templateDto(template: PreviewFile["templates"][number]): TemplateDTO {
  return {
    id: template.id,
    name: template.name,
    category: "all",
    layoutConfig: layoutOf(template),
    availableFields: ["title", "discount", "price", "validity", "address"],
    isActive: true,
    createdBy: "user-admin",
    createdAt: daysAgo(30),
    updatedAt: daysAgo(2),
  };
}

function businessDto(business: PreviewFile["businesses"][number]): BusinessDTO {
  const branches = data.branches.filter((branch) => branch.businessId === business.id);
  const offers = data.offers.filter((offer) => offer.businessId === business.id && offer.status !== "archived");
  return {
    id: business.id,
    ownerId: business.ownerId,
    businessName: business.businessName,
    slug: business.slug,
    category: business.category,
    categoryName: categoryName(business.category),
    description: business.description,
    contactPhone: business.contactPhone,
    website: business.website,
    isActive: business.isActive,
    createdAt: daysAgo(business.updatedDaysAgo + 10),
    updatedAt: daysAgo(business.updatedDaysAgo),
    branchCount: branches.length,
    offerCount: offers.length,
  };
}

function branchDto(branch: PreviewFile["branches"][number]): BranchDTO {
  const business = data.businesses.find((item) => item.id === branch.businessId);
  return {
    id: branch.id,
    businessId: branch.businessId,
    businessName: business?.businessName,
    branchName: branch.branchName,
    address: addressOf(branch),
    latitude: branch.lat,
    longitude: branch.lng,
    openingHours: hours(branch.sundayClosed),
    phone: branch.phone,
    isActive: branch.isActive,
    createdAt: daysAgo(20),
    updatedAt: daysAgo(2),
  };
}

function offerRecord(offer: PreviewFile["offers"][number]) {
  const rangeStart = dateInputToRange(shiftDateKey(new Date(), offer.fromOffset, ZONE), ZONE).start;
  const rangeEnd = dateInputToRange(shiftDateKey(new Date(), offer.untilOffset, ZONE), ZONE).end;
  const business = data.businesses.find((item) => item.id === offer.businessId);
  const branch = data.branches.find((item) => item.id === offer.branchId);
  const template = data.templates.find((item) => item.id === offer.templateId);
  return { offer, rangeStart, rangeEnd, business, branch, template };
}

function toPublic(record: ReturnType<typeof offerRecord>, distanceKm?: number): PublicOfferDTO | null {
  const { offer, rangeStart, rangeEnd, business, branch, template } = record;
  if (!business || !branch || !template) return null;
  const schedule = {
    status: offer.status,
    validFrom: rangeStart,
    validUntil: rangeEnd,
    activeDays: offer.activeDays,
    startTime: offer.startTime,
    endTime: offer.endTime,
    timezone: ZONE,
  };
  const availability: Availability = availabilityOf(schedule);
  return {
    id: offer.id,
    title: offer.title,
    slug: offer.slug,
    description: offer.description,
    offerType: offer.offerType,
    discountValue: offer.discountValue,
    originalPrice: offer.originalPrice,
    discountedPrice: offer.discountedPrice,
    items: [],
    discountLabel: discountLabel(offer),
    validFrom: rangeStart.toISOString(),
    validUntil: rangeEnd.toISOString(),
    activeDays: offer.activeDays ?? [],
    startTime: offer.startTime,
    endTime: offer.endTime,
    timezone: ZONE,
    termsAndConditions: offer.terms,
    hasRedemptionLimit: true,
    status: offer.status,
    availability,
    openNow: isWithinSchedule(schedule),
    business: {
      id: business.id,
      businessName: business.businessName,
      slug: business.slug,
      category: business.category,
      categoryName: categoryName(business.category),
      contactPhone: business.contactPhone,
      website: business.website,
    },
    branch: {
      id: branch.id,
      branchName: branch.branchName,
      address: addressOf(branch),
      latitude: branch.lat,
      longitude: branch.lng,
      phone: branch.phone,
      openingHours: hours(branch.sundayClosed),
    },
    template: { id: template.id, name: template.name, layoutConfig: layoutOf(template) },
    distanceKm,
  };
}

function toManaged(record: ReturnType<typeof offerRecord>): ManagedOfferDTO | null {
  const offer = toPublic(record);
  if (!offer) return null;
  return {
    ...offer,
    viewsCount: record.offer.viewsCount,
    redemptionLimit: 100,
    redemptionCount: data.redemptions.filter((item) => item.offerId === record.offer.id && item.status !== "cancelled").length,
    favoriteCount: data.favorites.filter((item) => item.offerId === record.offer.id).length,
    businessId: record.offer.businessId,
    branchId: record.offer.branchId,
    templateId: record.offer.templateId,
    createdAt: daysAgo(record.offer.createdDaysAgo),
  };
}

function visiblePublic(record: ReturnType<typeof offerRecord>, now = new Date()) {
  if (!record.business?.isActive || !record.branch?.isActive || record.offer.status !== "published") return false;
  const availability = availabilityOf(
    { status: "published", validFrom: record.rangeStart, validUntil: record.rangeEnd, timezone: ZONE },
    now,
  );
  return availability === "active" || availability === "scheduled";
}

function paginate<T>(items: T[], page: number, limit: number): PageResult<T> {
  const start = (page - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    page,
    limit,
    total: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / limit)),
  };
}

function publicOffers() {
  return data.offers.map(offerRecord).filter((record) => visiblePublic(record));
}

export function previewSettings() {
  return {
    supportEmail: data.settings.supportEmail,
    defaultRadiusKm: data.settings.defaultRadiusKm,
    maxRadiusKm: 50,
    imageStorage: "local-dev" as const,
    emailDelivery: "unconfigured" as const,
  };
}

export function previewCategories(includeInactive = false) {
  return data.categories.filter((category) => includeInactive || category.isActive);
}

export function previewCategoryBySlug(slug: string) {
  return data.categories.find((category) => category.slug === slug && category.isActive) ?? null;
}

export function previewTemplates(includeInactive = false) {
  const templates = data.templates.map(templateDto);
  return includeInactive ? templates : templates.filter((template) => template.isActive);
}

export function previewTemplate(id: string) {
  const template = data.templates.find((item) => item.id === id);
  return template ? templateDto(template) : null;
}

export function previewPublicOffers(input: {
  page: number;
  limit: number;
  q?: string;
  category?: string;
  city?: string;
  area?: string;
  pincode?: string;
  businessSlug?: string;
  offerType?: OfferType;
  discountMin?: number;
  sort?: "newest" | "discount" | "ending" | "views";
  currentlyAvailable?: boolean;
}) {
  let records = publicOffers();
  if (input.category) records = records.filter((record) => record.business?.category === input.category);
  if (input.businessSlug) records = records.filter((record) => record.business?.slug === input.businessSlug);
  if (input.city) records = records.filter((record) => record.branch?.citySlug === slugify(input.city!));
  if (input.area) {
    const area = new RegExp(escapeRegex(input.area), "i");
    records = records.filter((record) => area.test(record.branch?.area || ""));
  }
  if (input.pincode) records = records.filter((record) => record.branch?.pincode === input.pincode);
  if (input.offerType) records = records.filter((record) => record.offer.offerType === input.offerType);
  if (input.q) {
    const query = new RegExp(escapeRegex(input.q), "i");
    records = records.filter((record) => query.test(record.offer.title) || query.test(record.business?.businessName || ""));
  }
  if (input.currentlyAvailable) records = records.filter((record) => isWithinSchedule({ status: "published", validFrom: record.rangeStart, validUntil: record.rangeEnd, activeDays: record.offer.activeDays, startTime: record.offer.startTime, endTime: record.offer.endTime, timezone: ZONE }));
  if (input.discountMin != null) records = records.filter((record) => discountScore(record.offer) >= input.discountMin!);
  if (input.sort === "ending") records.sort((a, b) => +a.rangeEnd - +b.rangeEnd);
  else if (input.sort === "views") records.sort((a, b) => b.offer.viewsCount - a.offer.viewsCount);
  else if (input.sort === "discount") records.sort((a, b) => discountScore(b.offer) - discountScore(a.offer));
  else records.sort((a, b) => a.offer.createdDaysAgo - b.offer.createdDaysAgo);
  return paginate(records.map((record) => toPublic(record)).filter((offer): offer is PublicOfferDTO => Boolean(offer)), input.page, input.limit);
}

export function previewHome(): HomePayload {
  const featured = previewPublicOffers({ page: 1, limit: 4, sort: "views" }).items;
  const recent = previewPublicOffers({ page: 1, limit: 4, sort: "newest" }).items;
  const expiring = publicOffers()
    .filter((record) => record.rangeEnd.getTime() - Date.now() <= 48 * 60 * 60 * 1000)
    .map((record) => toPublic(record))
    .filter((offer): offer is PublicOfferDTO => Boolean(offer));
  const counts = new Map<string, number>();
  for (const record of publicOffers()) counts.set(record.offer.businessId, (counts.get(record.offer.businessId) ?? 0) + 1);
  const popularBusinesses = data.businesses
    .filter((business) => business.isActive && (counts.get(business.id) ?? 0) > 0)
    .map((business) => ({ ...businessDto(business), offerCount: counts.get(business.id) ?? 0 }))
    .sort((a, b) => (b.offerCount ?? 0) - (a.offerCount ?? 0))
    .slice(0, 6);
  return { categories: previewCategories(), featured, expiring, recent, popularBusinesses, settings: previewSettings() };
}

export function previewBusinessById(id: string) {
  const business = data.businesses.find((item) => item.id === id);
  if (!business) return null;
  return {
    business: businessDto(business),
    branches: data.branches.filter((branch) => branch.businessId === id).map(branchDto),
    offers: previewManagedOffers({ page: 1, limit: 20, ownerId: business.ownerId }).items.filter((offer) => offer.businessId === id),
  };
}

export function previewBusinessProfile(slug: string) {
  const business = data.businesses.find((item) => item.slug === slug && item.isActive);
  if (!business) return null;
  const branches = data.branches.filter((branch) => branch.businessId === business.id && branch.isActive).map(branchDto);
  const offers = previewPublicOffers({ page: 1, limit: 24, businessSlug: slug }).items;
  return { business: businessDto(business), branches, offers };
}

export function previewOfferBySlug(slug: string) {
  const record = data.offers.map(offerRecord).find((item) => item.offer.slug === slug);
  if (!record || record.offer.status !== "published" || !record.business?.isActive || !record.branch?.isActive) return null;
  const offer = toPublic(record);
  if (!offer) return null;
  const related = publicOffers()
    .filter((item) => item.offer.businessId === record.offer.businessId && item.offer.id !== record.offer.id)
    .slice(0, 3)
    .map((item) => toPublic(item))
    .filter((item): item is PublicOfferDTO => Boolean(item));
  return { offer, related };
}

export function previewManagedOffers(input: { page: number; limit: number; ownerId?: string; q?: string; status?: string; category?: string }) {
  let records = data.offers.map(offerRecord).filter((record) => record.business && record.branch);
  if (input.ownerId) records = records.filter((record) => record.business?.ownerId === input.ownerId);
  if (input.category) records = records.filter((record) => record.business?.category === input.category);
  if (input.status === "expired") records = records.filter((record) => record.offer.status === "published" && record.rangeEnd < new Date());
  else if (input.status && input.status !== "all") records = records.filter((record) => record.offer.status === input.status);
  if (input.q) {
    const query = new RegExp(escapeRegex(input.q), "i");
    records = records.filter((record) => query.test(record.offer.title));
  }
  records.sort((a, b) => a.offer.createdDaysAgo - b.offer.createdDaysAgo);
  return paginate(records.map(toManaged).filter((offer): offer is ManagedOfferDTO => Boolean(offer)), input.page, input.limit);
}

export function previewManagedOffer(id: string, ownerId?: string) {
  const record = data.offers.map(offerRecord).find((item) => item.offer.id === id);
  if (!record || (ownerId && record.business?.ownerId !== ownerId)) return null;
  return toManaged(record);
}

export function previewNearby(input: { lat: number; lng: number; radiusKm: number; page: number; limit: number; sort: "distance" | "newest" | "discount"; category?: string; offerType?: OfferType; q?: string }) {
  const geo = validateNearbyQuery(input);
  const records = publicOffers();
  const withDistance = records
    .map((record) => ({ record, distanceKm: haversine(geo.lat, geo.lng, record.branch!.lat, record.branch!.lng) }))
    .filter((item) => item.distanceKm <= geo.radiusKm);
  if (input.category) withDistance.splice(0, withDistance.length, ...withDistance.filter((item) => item.record.business?.category === input.category));
  if (input.offerType) withDistance.splice(0, withDistance.length, ...withDistance.filter((item) => item.record.offer.offerType === input.offerType));
  if (input.q) {
    const query = input.q.toLowerCase();
    withDistance.splice(0, withDistance.length, ...withDistance.filter((item) => item.record.offer.title.toLowerCase().includes(query) || (item.record.business?.businessName.toLowerCase().includes(query) ?? false)));
  }
  if (input.sort === "newest") withDistance.sort((a, b) => a.record.offer.createdDaysAgo - b.record.offer.createdDaysAgo);
  else if (input.sort === "discount") withDistance.sort((a, b) => discountScore(b.record.offer) - discountScore(a.record.offer));
  else withDistance.sort((a, b) => a.distanceKm - b.distanceKm);
  return paginate(
    withDistance.map((item) => toPublic(item.record, Math.round(item.distanceKm * 10) / 10)).filter((offer): offer is PublicOfferDTO => Boolean(offer)),
    input.page,
    input.limit,
  );
}

export function previewCities() {
  const cities = new Map<string, string>();
  for (const record of publicOffers()) {
    if (record.branch) cities.set(record.branch.citySlug, record.branch.city);
  }
  return [...cities.entries()].map(([slug, name]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name));
}

export function previewSitemap() {
  const offers = publicOffers();
  const businessIds = new Set(offers.map((record) => record.offer.businessId));
  return {
    offers: offers.map((record) => ({ slug: record.offer.slug, updatedAt: new Date(daysAgo(record.offer.createdDaysAgo)) })),
    businesses: data.businesses.filter((business) => businessIds.has(business.id)).map((business) => ({ slug: business.slug, updatedAt: new Date(daysAgo(business.updatedDaysAgo)) })),
    categories: [...new Set(offers.map((record) => record.business?.category).filter((slug): slug is string => Boolean(slug)))],
    cities: previewCities(),
  };
}

export function previewOwnerBusinesses(ownerId: string) {
  return data.businesses.filter((business) => business.ownerId === ownerId).map(businessDto);
}

export function previewBusinessForOwner(ownerId: string, businessId: string) {
  const business = data.businesses.find((item) => item.id === businessId && item.ownerId === ownerId);
  return business ? businessDto(business) : null;
}

export function previewAdminBusinesses(input: { page: number; limit: number; q?: string; category?: string; city?: string; isActive?: boolean }) {
  let businesses = data.businesses.slice();
  if (input.category) businesses = businesses.filter((business) => business.category === input.category);
  if (input.isActive != null) businesses = businesses.filter((business) => business.isActive === input.isActive);
  if (input.q) {
    const query = new RegExp(escapeRegex(input.q), "i");
    businesses = businesses.filter((business) => query.test(business.businessName));
  }
  if (input.city) {
    const slug = slugify(input.city);
    const ids = new Set(data.branches.filter((branch) => branch.citySlug === slug).map((branch) => branch.businessId));
    businesses = businesses.filter((business) => ids.has(business.id));
  }
  return paginate(businesses.map(businessDto), input.page, input.limit);
}

export function previewBranchesForOwner(ownerId: string, businessId?: string) {
  const owned = new Set(data.businesses.filter((business) => business.ownerId === ownerId).map((business) => business.id));
  return data.branches.filter((branch) => owned.has(branch.businessId) && (!businessId || branch.businessId === businessId)).map(branchDto);
}

export function previewBranchForOwner(ownerId: string, branchId: string) {
  return previewBranchesForOwner(ownerId).find((branch) => branch.id === branchId) ?? null;
}

export function previewAdminBranches(input: { page: number; limit: number; q?: string; city?: string; isActive?: boolean }) {
  let branches = data.branches.slice();
  if (input.city) branches = branches.filter((branch) => branch.citySlug === slugify(input.city!));
  if (input.isActive != null) branches = branches.filter((branch) => branch.isActive === input.isActive);
  if (input.q) {
    const query = new RegExp(escapeRegex(input.q), "i");
    branches = branches.filter((branch) => query.test(branch.branchName));
  }
  return paginate(branches.map(branchDto), input.page, input.limit);
}

export function previewFavorites(userId: string): FavoriteDTO[] {
  return data.favorites
    .filter((favorite) => favorite.userId === userId)
    .map((favorite) => {
      const record = data.offers.map(offerRecord).find((item) => item.offer.id === favorite.offerId);
      const offer = record ? toPublic(record) : null;
      return offer ? { id: favorite.id, createdAt: daysAgo(favorite.createdDaysAgo), offer } : null;
    })
    .filter((favorite): favorite is FavoriteDTO => Boolean(favorite));
}

export function previewIsFavorite(userId: string, offerId: string) {
  return data.favorites.some((favorite) => favorite.userId === userId && favorite.offerId === offerId);
}

function redemptionDto(item: PreviewFile["redemptions"][number], includeCustomer: boolean): RedemptionDTO {
  const offer = data.offers.find((entry) => entry.id === item.offerId);
  const branch = data.branches.find((entry) => entry.id === offer?.branchId);
  const business = data.businesses.find((entry) => entry.id === offer?.businessId);
  const user = data.users.find((entry) => entry.id === item.userId);
  return {
    id: item.id,
    offerId: item.offerId,
    offerTitle: offer?.title || "Offer",
    offerSlug: offer?.slug || "",
    branchId: branch?.id || "",
    branchName: branch?.branchName || "Branch",
    businessName: business?.businessName || "Business",
    redemptionCode: item.code,
    status: item.status,
    claimedAt: daysAgo(item.claimedDaysAgo),
    redeemedAt: item.redeemedDaysAgo != null ? daysAgo(item.redeemedDaysAgo) : undefined,
    customerName: includeCustomer ? user?.name : undefined,
  };
}

export function previewRedemptionsForUser(userId: string) {
  return data.redemptions.filter((item) => item.userId === userId).map((item) => redemptionDto(item, false));
}

export function previewRedemptionsForOwner(ownerId: string, page: number, limit: number) {
  const owned = new Set(data.businesses.filter((business) => business.ownerId === ownerId).map((business) => business.id));
  const items = data.redemptions.filter((item) => owned.has(data.offers.find((offer) => offer.id === item.offerId)?.businessId || ""));
  return paginate(items.map((item) => redemptionDto(item, true)), page, limit);
}

export function previewSaveCounts(ownerId: string) {
  const owned = new Set(data.businesses.filter((business) => business.ownerId === ownerId).map((business) => business.id));
  return data.offers
    .filter((offer) => owned.has(offer.businessId) && offer.status !== "archived")
    .map((offer) => ({
      id: offer.id,
      title: offer.title,
      slug: offer.slug,
      status: offer.status,
      views: offer.viewsCount,
      saves: data.favorites.filter((favorite) => favorite.offerId === offer.id).length,
    }));
}

function reportDto(report: PreviewFile["reports"][number]): ReportDTO {
  const offer = data.offers.find((item) => item.id === report.offerId);
  const business = data.businesses.find((item) => item.id === offer?.businessId);
  const user = data.users.find((item) => item.id === report.userId);
  return {
    id: report.id,
    userId: report.userId,
    userName: user?.name,
    offerId: report.offerId,
    offerTitle: offer?.title,
    offerSlug: offer?.slug,
    businessName: business?.businessName,
    reason: report.reason,
    description: report.description,
    status: report.status,
    resolutionNote: report.resolutionNote,
    createdAt: daysAgo(report.createdDaysAgo),
    updatedAt: daysAgo(report.createdDaysAgo),
  };
}

export function previewReportsForOwner(ownerId: string, page: number, limit: number) {
  const owned = new Set(data.businesses.filter((business) => business.ownerId === ownerId).map((business) => business.id));
  const items = data.reports.filter((report) => owned.has(data.offers.find((offer) => offer.id === report.offerId)?.businessId || ""));
  return paginate(items.map(reportDto), page, limit);
}

export function previewReportsForAdmin(page: number, limit: number, status?: string) {
  const items = data.reports.filter((report) => !status || status === "all" || report.status === status);
  return paginate(items.map(reportDto), page, limit);
}

export function previewOwnerStats(ownerId: string) {
  const offers = data.offers.filter((offer) => data.businesses.some((business) => business.id === offer.businessId && business.ownerId === ownerId));
  const now = new Date();
  const records = offers.map(offerRecord);
  return {
    businesses: data.businesses.filter((business) => business.ownerId === ownerId).length,
    branches: previewBranchesForOwner(ownerId).length,
    offers: offers.filter((offer) => offer.status !== "archived").length,
    activeOffers: records.filter((record) => visiblePublic(record, now)).length,
    draftOffers: offers.filter((offer) => offer.status === "draft").length,
    expiredOffers: records.filter((record) => record.offer.status === "published" && record.rangeEnd < now).length,
    views: offers.reduce((sum, offer) => sum + offer.viewsCount, 0),
    favorites: data.favorites.filter((favorite) => offers.some((offer) => offer.id === favorite.offerId)).length,
    redemptions: data.redemptions.filter((item) => offers.some((offer) => offer.id === item.offerId) && item.status !== "cancelled").length,
    openReports: data.reports.filter((report) => offers.some((offer) => offer.id === report.offerId) && (report.status === "open" || report.status === "reviewing")).length,
  };
}

export function previewAdminStats() {
  const now = new Date();
  const records = data.offers.map(offerRecord);
  return {
    customers: data.users.filter((user) => user.role === "customer").length,
    owners: data.users.filter((user) => user.role === "owner").length,
    businesses: data.businesses.length,
    branches: data.branches.length,
    offers: data.offers.filter((offer) => offer.status !== "archived").length,
    activeOffers: records.filter((record) => visiblePublic(record, now)).length,
    expiredOffers: records.filter((record) => record.offer.status === "published" && record.rangeEnd < now).length,
    redemptions: data.redemptions.filter((item) => item.status !== "cancelled").length,
    openReports: data.reports.filter((report) => report.status === "open" || report.status === "reviewing").length,
  };
}

function userDto(user: PreviewFile["users"][number]): UserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    createdAt: daysAgo(user.createdDaysAgo),
    businessCount: data.businesses.filter((business) => business.ownerId === user.id).length,
  };
}

export function previewUsers(input: { page: number; limit: number; q?: string; role?: UserRole; isActive?: boolean }) {
  let users = data.users.slice();
  if (input.role) users = users.filter((user) => user.role === input.role);
  if (input.isActive != null) users = users.filter((user) => user.isActive === input.isActive);
  if (input.q) {
    const query = new RegExp(escapeRegex(input.q), "i");
    users = users.filter((user) => query.test(user.name) || query.test(user.email));
  }
  users.sort((a, b) => a.createdDaysAgo - b.createdDaysAgo);
  return paginate(users.map(userDto), input.page, input.limit);
}

export function previewUser(id: string) {
  const user = data.users.find((item) => item.id === id);
  return user ? userDto(user) : null;
}

export function previewRecentUsers(limit: number) {
  return data.users.slice().sort((a, b) => a.createdDaysAgo - b.createdDaysAgo).slice(0, limit).map(userDto);
}

export function previewActivity(page: number, limit: number, q?: string): PageResult<ActivityDTO> {
  let items = data.activity.slice();
  if (q) {
    const query = q.toLowerCase();
    items = items.filter((item) => item.action.includes(query) || item.resourceType.includes(query));
  }
  items.sort((a, b) => a.hoursAgo - b.hoursAgo);
  return paginate(
    items.map((item) => ({
      id: item.id,
      actorId: item.actorId,
      actorName: data.users.find((user) => user.id === item.actorId)?.name,
      action: item.action,
      resourceType: item.resourceType,
      resourceId: item.resourceId,
      createdAt: new Date(Date.now() - item.hoursAgo * 60 * 60 * 1000).toISOString(),
    })),
    page,
    limit,
  );
}

export function previewSession(role: UserRole): SessionUser {
  const match = data.users.find((user) => user.role === role && user.isActive);
  const user = match ?? data.users[0];
  if (!user) {
    return { id: "user-preview", name: "Preview", email: "preview@loco.local", role };
  }
  return { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role };
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
