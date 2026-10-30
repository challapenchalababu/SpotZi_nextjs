export const USER_ROLES = ["customer", "owner", "super_admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const PORTALS = ["customer", "owner", "super_admin"] as const;
export type Portal = (typeof PORTALS)[number];

export const OFFER_TYPES = ["percentage", "flat", "bogo", "special"] as const;
export type OfferType = (typeof OFFER_TYPES)[number];

export const OFFER_STATUSES = ["draft", "published", "paused", "archived"] as const;
export type OfferStatus = (typeof OFFER_STATUSES)[number];

export const REDEMPTION_STATUSES = ["claimed", "redeemed", "cancelled"] as const;
export type RedemptionStatus = (typeof REDEMPTION_STATUSES)[number];

export const REPORT_STATUSES = ["open", "reviewing", "resolved", "dismissed"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_REASONS = ["misleading", "expired", "inappropriate", "spam", "other"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export const POSTER_LAYOUTS = ["classic", "bold", "minimal", "split", "market", "night", "fresh", "frame", "ticket"] as const;
export type PosterLayout = (typeof POSTER_LAYOUTS)[number];

export const AVAILABILITY = ["active", "scheduled", "expired", "paused", "draft", "archived"] as const;
export type Availability = (typeof AVAILABILITY)[number];

export interface LayoutConfig {
  layout: PosterLayout;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  mutedColor: string;
  fontFamily: "sans" | "serif";
  logoPosition: "top-left" | "top-center" | "top-right";
  showAddress: boolean;
  showValidity: boolean;
  showPrices: boolean;
}

export interface Address {
  line1: string;
  line2?: string;
  area: string;
  city: string;
  citySlug: string;
  state?: string;
  pincode: string;
  country: string;
}

export interface OpeningDay {
  closed: boolean;
  open: string;
  close: string;
}

export type OpeningHours = Record<Weekday, OpeningDay>;

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  profileImage?: string;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
}

export interface BusinessCard {
  id: string;
  businessName: string;
  slug: string;
  category: string;
  categoryName?: string;
  description: string;
  logoUrl?: string;
  isActive: boolean;
  offerCount?: number;
}

export interface BusinessDTO extends BusinessCard {
  ownerId: string;
  contactPhone?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
  branchCount?: number;
}

export interface BranchDTO {
  id: string;
  businessId: string;
  businessName?: string;
  branchName: string;
  slug?: string;
  address: Address;
  latitude: number;
  longitude: number;
  openingHours: OpeningHours;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OfferItemDTO {
  name: string;
  originalPrice?: number;
  discountedPrice?: number;
  discountPercent?: number;
  discountValue?: number;
  posterUrl?: string;
  sortOrder: number;
}

export interface OfferProductInput {
  name: string;
  discountValue?: number;
  originalPrice?: number;
  discountedPrice?: number;
  posterUrl?: string;
}

export interface PublicStoreDTO {
  id: string;
  slug: string;
  branchName: string;
  address: Address;
  latitude: number;
  longitude: number;
  phone?: string;
  openingHours: OpeningHours;
  offerCount: number;
  itemCount: number;
  topDiscountLabel?: string;
  posterUrl?: string;
  distanceKm?: number;
  business: PublicBusinessRef;
}

export interface TemplateDTO {
  id: string;
  name: string;
  category: string;
  thumbnailUrl?: string;
  backgroundUrl?: string;
  layoutConfig: LayoutConfig;
  availableFields: string[];
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicBusinessRef {
  id: string;
  businessName: string;
  slug: string;
  logoUrl?: string;
  category: string;
  categoryName?: string;
  contactPhone?: string;
  website?: string;
}

export interface PublicBranchRef {
  id: string;
  branchName: string;
  slug?: string;
  address: Address;
  latitude: number;
  longitude: number;
  phone?: string;
  openingHours: OpeningHours;
}

export interface PublicOfferDTO {
  id: string;
  title: string;
  slug: string;
  description: string;
  offerType: OfferType;
  discountValue?: number;
  originalPrice?: number;
  discountedPrice?: number;
  items: OfferItemDTO[];
  discountLabel: string;
  posterUrl?: string;
  validFrom: string;
  validUntil: string;
  activeDays: Weekday[];
  startTime?: string;
  endTime?: string;
  timezone: string;
  termsAndConditions?: string;
  hasRedemptionLimit: boolean;
  status: OfferStatus;
  availability: Availability;
  openNow: boolean;
  business: PublicBusinessRef;
  branch: PublicBranchRef;
  template?: {
    id: string;
    name: string;
    layoutConfig: LayoutConfig;
    backgroundUrl?: string;
  };
  distanceKm?: number;
}

export interface ManagedOfferDTO extends PublicOfferDTO {
  viewsCount: number;
  redemptionLimit?: number;
  redemptionCount?: number;
  favoriteCount?: number;
  businessId: string;
  branchId: string;
  templateId?: string;
  createdAt: string;
}

export interface FavoriteDTO {
  id: string;
  createdAt: string;
  offer: PublicOfferDTO;
}

export interface RedemptionDTO {
  id: string;
  offerId: string;
  offerTitle: string;
  offerSlug: string;
  branchId: string;
  branchName: string;
  businessName: string;
  redemptionCode: string;
  status: RedemptionStatus;
  claimedAt: string;
  redeemedAt?: string;
  customerName?: string;
}

export interface RedemptionCheck {
  valid: boolean;
  reason: "claimed" | "redeemed" | "cancelled" | "not_found" | "wrong_shop";
  message: string;
  redemption?: RedemptionDTO;
}

export interface ReportDTO {
  id: string;
  userId: string;
  userName?: string;
  offerId: string;
  offerTitle?: string;
  offerSlug?: string;
  businessName?: string;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  resolutionNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityDTO {
  id: string;
  actorId?: string;
  actorName?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, string | number | boolean | null>;
  createdAt: string;
}

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  profileImage?: string;
  isActive: boolean;
  createdAt: string;
  businessCount?: number;
}

export interface PageResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OwnerStats {
  businesses: number;
  branches: number;
  offers: number;
  activeOffers: number;
  draftOffers: number;
  expiredOffers: number;
  views: number;
  favorites: number;
  redemptions: number;
  openReports: number;
}

export interface AdminStats {
  customers: number;
  owners: number;
  businesses: number;
  branches: number;
  offers: number;
  activeOffers: number;
  expiredOffers: number;
  redemptions: number;
  openReports: number;
}

export interface PlatformSettingsDTO {
  supportEmail: string;
  defaultRadiusKm: number;
  maxRadiusKm: number;
  imageStorage: "cloudinary" | "local-dev" | "unconfigured";
  emailDelivery: "smtp" | "unconfigured";
}

export interface HomePayload {
  categories: CategoryDTO[];
  featured: PublicOfferDTO[];
  expiring: PublicOfferDTO[];
  recent: PublicOfferDTO[];
  popularBusinesses: BusinessCard[];
  settings: PlatformSettingsDTO;
}
