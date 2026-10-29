import { discountLabel } from "@/lib/discount";
import { normalizeOpeningHours } from "@/lib/hours";
import { availabilityOf, isWithinSchedule, type ScheduleInput } from "@/lib/offer-validity";
import { safeImageUrl, safeWebsiteUrl } from "@/lib/sanitize";
import type {
  ActivityDTO,
  Address,
  BranchDTO,
  BusinessDTO,
  CategoryDTO,
  FavoriteDTO,
  LayoutConfig,
  ManagedOfferDTO,
  OpeningHours,
  PublicOfferDTO,
  RedemptionDTO,
  ReportDTO,
  TemplateDTO,
  UserDTO,
  Weekday,
} from "@/types/domain";
import type {
  ActivityRecord,
  BranchRecord,
  BusinessRecord,
  CategoryRecord,
  FavoriteRecord,
  OfferRecord,
  RedemptionRecord,
  ReportRecord,
  TemplateRecord,
  UserRecord,
} from "@/models";

export function asId(value: unknown) {
  if (value && typeof value === "object" && "_id" in value) return String((value as { _id: unknown })._id);
  return String(value ?? "");
}

function iso(value?: Date | string | null) {
  if (!value) return undefined;
  return new Date(value).toISOString();
}

export function toCategory(doc: CategoryRecord): CategoryDTO {
  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    icon: doc.icon,
    description: doc.description,
    isActive: doc.isActive,
    sortOrder: doc.sortOrder,
  };
}

export function toUser(doc: UserRecord, businessCount?: number): UserDTO {
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    phone: doc.phone || undefined,
    role: doc.role,
    profileImage: safeImageUrl(doc.profileImage),
    isActive: doc.isActive,
    createdAt: iso(doc.createdAt) || new Date(0).toISOString(),
    businessCount,
  };
}

export function toBusiness(doc: BusinessRecord, extras?: { categoryName?: string; branchCount?: number; offerCount?: number }): BusinessDTO {
  return {
    id: String(doc._id),
    ownerId: asId(doc.ownerId),
    businessName: doc.businessName,
    slug: doc.slug,
    category: doc.category,
    categoryName: extras?.categoryName,
    description: doc.description,
    logoUrl: safeImageUrl(doc.logoUrl),
    contactPhone: doc.contactPhone || undefined,
    website: safeWebsiteUrl(doc.website),
    isActive: doc.isActive,
    createdAt: iso(doc.createdAt) || new Date(0).toISOString(),
    updatedAt: iso(doc.updatedAt) || new Date(0).toISOString(),
    branchCount: extras?.branchCount,
    offerCount: extras?.offerCount,
  };
}

export function toBranch(doc: BranchRecord, businessName?: string): BranchDTO {
  const [longitude, latitude] = doc.location.coordinates;
  return {
    id: String(doc._id),
    businessId: asId(doc.businessId),
    businessName,
    branchName: doc.branchName,
    address: doc.address,
    latitude,
    longitude,
    openingHours: normalizeOpeningHours(doc.openingHours),
    phone: doc.phone || undefined,
    isActive: doc.isActive,
    createdAt: iso(doc.createdAt) || new Date(0).toISOString(),
    updatedAt: iso(doc.updatedAt) || new Date(0).toISOString(),
  };
}

export function toTemplate(doc: TemplateRecord): TemplateDTO {
  return {
    id: String(doc._id),
    name: doc.name,
    category: doc.category,
    thumbnailUrl: safeImageUrl(doc.thumbnailUrl),
    backgroundUrl: safeImageUrl(doc.backgroundUrl),
    layoutConfig: doc.layoutConfig,
    availableFields: doc.availableFields ?? [],
    isActive: doc.isActive,
    createdBy: doc.createdBy ? asId(doc.createdBy) : undefined,
    createdAt: iso(doc.createdAt) || new Date(0).toISOString(),
    updatedAt: iso(doc.updatedAt) || new Date(0).toISOString(),
  };
}

export function toPublicOffer(input: {
  offer: OfferRecord;
  business: BusinessRecord;
  branch: BranchRecord;
  template?: TemplateRecord | null;
  categoryName?: string;
  distanceKm?: number;
  now?: Date;
}): PublicOfferDTO {
  const { offer, business, branch } = input;
  const schedule: ScheduleInput = {
    status: offer.status,
    validFrom: offer.validFrom,
    validUntil: offer.validUntil,
    activeDays: offer.activeDays,
    startTime: offer.startTime,
    endTime: offer.endTime,
    timezone: offer.timezone,
  };
  const branchDto = toBranch(branch);
  return {
    id: String(offer._id),
    title: offer.title,
    slug: offer.slug,
    description: offer.description,
    offerType: offer.offerType,
    discountValue: offer.discountValue ?? undefined,
    originalPrice: offer.originalPrice ?? undefined,
    discountedPrice: offer.discountedPrice ?? undefined,
    discountLabel: discountLabel(offer),
    posterUrl: safeImageUrl(offer.posterUrl),
    validFrom: iso(offer.validFrom) || new Date(0).toISOString(),
    validUntil: iso(offer.validUntil) || new Date(0).toISOString(),
    activeDays: offer.activeDays ?? [],
    startTime: offer.startTime || undefined,
    endTime: offer.endTime || undefined,
    timezone: offer.timezone,
    termsAndConditions: offer.termsAndConditions || undefined,
    hasRedemptionLimit: offer.redemptionLimit != null,
    status: offer.status,
    availability: availabilityOf(schedule, input.now),
    openNow: isWithinSchedule(schedule, input.now),
    business: {
      id: String(business._id),
      businessName: business.businessName,
      slug: business.slug,
      logoUrl: safeImageUrl(business.logoUrl),
      category: business.category,
      categoryName: input.categoryName,
      contactPhone: business.contactPhone || undefined,
      website: safeWebsiteUrl(business.website),
    },
    branch: {
      id: branchDto.id,
      branchName: branchDto.branchName,
      address: branchDto.address,
      latitude: branchDto.latitude,
      longitude: branchDto.longitude,
      phone: branchDto.phone,
      openingHours: branchDto.openingHours,
    },
    template: input.template
      ? {
          id: String(input.template._id),
          name: input.template.name,
          layoutConfig: input.template.layoutConfig as LayoutConfig,
          backgroundUrl: safeImageUrl(input.template.backgroundUrl),
        }
      : undefined,
    distanceKm: input.distanceKm,
  };
}

export function toManagedOffer(
  input: Parameters<typeof toPublicOffer>[0] & {
    redemptionCount?: number;
    favoriteCount?: number;
  },
): ManagedOfferDTO {
  return {
    ...toPublicOffer(input),
    viewsCount: input.offer.viewsCount ?? 0,
    redemptionLimit: input.offer.redemptionLimit ?? undefined,
    redemptionCount: input.redemptionCount,
    favoriteCount: input.favoriteCount,
    businessId: asId(input.offer.businessId),
    branchId: asId(input.offer.branchId),
    templateId: input.offer.templateId ? asId(input.offer.templateId) : input.template ? String(input.template._id) : undefined,
    createdAt: iso(input.offer.createdAt) || new Date(0).toISOString(),
  };
}

export function toFavorite(doc: FavoriteRecord, offer: PublicOfferDTO): FavoriteDTO {
  return { id: String(doc._id), createdAt: iso(doc.createdAt) || new Date(0).toISOString(), offer };
}

export function toRedemption(
  doc: RedemptionRecord,
  names: { offerTitle: string; offerSlug: string; branchName: string; businessName: string; customerName?: string },
): RedemptionDTO {
  return {
    id: String(doc._id),
    offerId: asId(doc.offerId),
    offerTitle: names.offerTitle,
    offerSlug: names.offerSlug,
    branchId: asId(doc.branchId),
    branchName: names.branchName,
    businessName: names.businessName,
    redemptionCode: doc.redemptionCode,
    status: doc.status,
    claimedAt: iso(doc.claimedAt) || new Date(0).toISOString(),
    redeemedAt: iso(doc.redeemedAt),
    customerName: names.customerName,
  };
}

export function toReport(
  doc: ReportRecord,
  names?: { userName?: string; offerTitle?: string; offerSlug?: string; businessName?: string },
): ReportDTO {
  return {
    id: String(doc._id),
    userId: asId(doc.userId),
    userName: names?.userName,
    offerId: asId(doc.offerId),
    offerTitle: names?.offerTitle,
    offerSlug: names?.offerSlug,
    businessName: names?.businessName,
    reason: doc.reason,
    description: doc.description,
    status: doc.status,
    resolutionNote: doc.resolutionNote || undefined,
    createdAt: iso(doc.createdAt) || new Date(0).toISOString(),
    updatedAt: iso(doc.updatedAt) || new Date(0).toISOString(),
  };
}

export function toActivity(doc: ActivityRecord, actorName?: string): ActivityDTO {
  return {
    id: String(doc._id),
    actorId: doc.actorId ? asId(doc.actorId) : undefined,
    actorName,
    action: doc.action,
    resourceType: doc.resourceType,
    resourceId: doc.resourceId || undefined,
    metadata: doc.metadata,
    createdAt: iso(doc.createdAt) || new Date(0).toISOString(),
  };
}

export function blank(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function publicAddress(address: Address): Address {
  return address;
}

export type { OpeningHours, Weekday };
