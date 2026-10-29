import mongoose, { Schema, type Model, type Types } from "mongoose";
import type {
  Address,
  LayoutConfig,
  OfferStatus,
  OfferType,
  OpeningHours,
  RedemptionStatus,
  ReportReason,
  ReportStatus,
  UserRole,
  Weekday,
} from "@/types/domain";

const pointSchema = new Schema(
  {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: { type: [Number], required: true },
  },
  { _id: false },
);

const addressSchema = new Schema(
  {
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    area: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    citySlug: { type: String, required: true, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: "India" },
  },
  { _id: false },
);

const openingDaySchema = new Schema(
  {
    closed: { type: Boolean, default: false },
    open: { type: String, default: "09:00" },
    close: { type: String, default: "21:00" },
  },
  { _id: false },
);

const layoutSchema = new Schema(
  {
    layout: { type: String, enum: ["classic", "bold", "minimal", "split", "market", "night", "fresh", "frame", "ticket"], required: true },
    backgroundColor: { type: String, required: true },
    textColor: { type: String, required: true },
    accentColor: { type: String, required: true },
    mutedColor: { type: String, required: true },
    fontFamily: { type: String, enum: ["sans", "serif"], required: true },
    logoPosition: { type: String, enum: ["top-left", "top-center", "top-right"], required: true },
    showAddress: { type: Boolean, default: true },
    showValidity: { type: Boolean, default: true },
    showPrices: { type: Boolean, default: true },
  },
  { _id: false },
);

export interface UserRecord {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  profileImage?: string;
  isActive: boolean;
  sessionVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserRecord>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["customer", "owner", "super_admin"], required: true },
    profileImage: { type: String },
    isActive: { type: Boolean, default: true },
    sessionVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export interface BusinessRecord {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  businessName: string;
  slug: string;
  category: string;
  description: string;
  logoUrl?: string;
  contactPhone?: string;
  website?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const businessSchema = new Schema<BusinessRecord>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    businessName: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    logoUrl: { type: String },
    contactPhone: { type: String, trim: true },
    website: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
businessSchema.index({ ownerId: 1, createdAt: -1 });
businessSchema.index({ category: 1, isActive: 1 });

export interface BranchRecord {
  _id: Types.ObjectId;
  businessId: Types.ObjectId;
  branchName: string;
  address: Address;
  location: { type: "Point"; coordinates: [number, number] };
  openingHours: OpeningHours;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const branchSchema = new Schema<BranchRecord>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    branchName: { type: String, required: true, trim: true, maxlength: 80 },
    address: { type: addressSchema, required: true },
    location: { type: pointSchema, required: true },
    openingHours: {
      monday: { type: openingDaySchema, required: true },
      tuesday: { type: openingDaySchema, required: true },
      wednesday: { type: openingDaySchema, required: true },
      thursday: { type: openingDaySchema, required: true },
      friday: { type: openingDaySchema, required: true },
      saturday: { type: openingDaySchema, required: true },
      sunday: { type: openingDaySchema, required: true },
    },
    phone: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
branchSchema.index({ businessId: 1 });
branchSchema.index({ "address.citySlug": 1, isActive: 1 });
branchSchema.index({ "address.pincode": 1 });
branchSchema.index({ location: "2dsphere" });

export interface TemplateRecord {
  _id: Types.ObjectId;
  name: string;
  category: string;
  thumbnailUrl?: string;
  backgroundUrl?: string;
  layoutConfig: LayoutConfig;
  availableFields: string[];
  isActive: boolean;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const templateSchema = new Schema<TemplateRecord>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    category: { type: String, required: true, trim: true, default: "all" },
    thumbnailUrl: { type: String },
    backgroundUrl: { type: String },
    layoutConfig: { type: layoutSchema, required: true },
    availableFields: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, collection: "offerTemplates" },
);

export interface OfferRecord {
  _id: Types.ObjectId;
  businessId: Types.ObjectId;
  branchId: Types.ObjectId;
  templateId?: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  offerType: OfferType;
  discountValue?: number;
  originalPrice?: number;
  discountedPrice?: number;
  posterUrl?: string;
  validFrom: Date;
  validUntil: Date;
  activeDays: Weekday[];
  startTime?: string;
  endTime?: string;
  timezone: string;
  location: { type: "Point"; coordinates: [number, number] };
  status: OfferStatus;
  termsAndConditions?: string;
  redemptionLimit?: number;
  viewsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const offerSchema = new Schema<OfferRecord>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    templateId: { type: Schema.Types.ObjectId, ref: "OfferTemplate" },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    offerType: { type: String, enum: ["percentage", "flat", "bogo", "special"], required: true },
    discountValue: { type: Number },
    originalPrice: { type: Number },
    discountedPrice: { type: Number },
    posterUrl: { type: String },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    activeDays: { type: [String], default: [] },
    startTime: { type: String },
    endTime: { type: String },
    timezone: { type: String, required: true, default: "Asia/Kolkata" },
    location: { type: pointSchema, required: true },
    status: { type: String, enum: ["draft", "published", "paused", "archived"], default: "draft" },
    termsAndConditions: { type: String },
    redemptionLimit: { type: Number },
    viewsCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);
offerSchema.index({ businessId: 1, status: 1 });
offerSchema.index({ branchId: 1 });
offerSchema.index({ status: 1, validUntil: 1, validFrom: 1 });
offerSchema.index({ location: "2dsphere" });

export interface FavoriteRecord {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  offerId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const favoriteSchema = new Schema<FavoriteRecord>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    offerId: { type: Schema.Types.ObjectId, ref: "Offer", required: true },
  },
  { timestamps: true },
);
favoriteSchema.index({ userId: 1, offerId: 1 }, { unique: true });

export interface RedemptionRecord {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  offerId: Types.ObjectId;
  branchId: Types.ObjectId;
  redemptionCode: string;
  status: RedemptionStatus;
  claimedAt: Date;
  redeemedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const redemptionSchema = new Schema<RedemptionRecord>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    offerId: { type: Schema.Types.ObjectId, ref: "Offer", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    redemptionCode: { type: String, required: true, unique: true },
    status: { type: String, enum: ["claimed", "redeemed", "cancelled"], default: "claimed" },
    claimedAt: { type: Date, required: true },
    redeemedAt: { type: Date },
  },
  { timestamps: true },
);
redemptionSchema.index({ offerId: 1, status: 1 });
redemptionSchema.index({ userId: 1, createdAt: -1 });
redemptionSchema.index(
  { userId: 1, offerId: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["claimed", "redeemed"] } } },
);

export interface ReportRecord {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  offerId: Types.ObjectId;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  resolutionNote?: string;
  resolvedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<ReportRecord>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    offerId: { type: Schema.Types.ObjectId, ref: "Offer", required: true },
    reason: { type: String, enum: ["misleading", "expired", "inappropriate", "spam", "other"], required: true },
    description: { type: String, required: true, maxlength: 1000 },
    status: { type: String, enum: ["open", "reviewing", "resolved", "dismissed"], default: "open" },
    resolutionNote: { type: String, maxlength: 500 },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ offerId: 1 });

export interface ActivityRecord {
  _id: Types.ObjectId;
  actorId?: Types.ObjectId;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, string | number | boolean | null>;
  createdAt: Date;
}

const activitySchema = new Schema<ActivityRecord>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    resourceType: { type: String, required: true },
    resourceId: { type: String },
    metadata: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: () => new Date() },
  },
  { collection: "activityLogs" },
);
activitySchema.index({ createdAt: -1 });
activitySchema.index({ actorId: 1, createdAt: -1 });

export interface CategoryRecord {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  icon: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<CategoryRecord>(
  {
    name: { type: String, required: true, trim: true, maxlength: 40 },
    slug: { type: String, required: true, unique: true },
    icon: { type: String, required: true },
    description: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export interface PasswordResetRecord {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

const passwordResetSchema = new Schema<PasswordResetRecord>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
passwordResetSchema.index({ userId: 1, expiresAt: 1 });

export interface RateLimitRecord {
  _id: Types.ObjectId;
  key: string;
  hits: Date[];
}

const rateLimitSchema = new Schema<RateLimitRecord>({
  key: { type: String, required: true, unique: true },
  hits: { type: [Date], default: [] },
});

export interface PlatformSettingsRecord {
  _id: string;
  supportEmail: string;
  defaultRadiusKm: number;
  updatedAt: Date;
}

const platformSettingsSchema = new Schema<PlatformSettingsRecord>(
  {
    _id: { type: String, default: "platform" },
    supportEmail: { type: String, default: "" },
    defaultRadiusKm: { type: Number, default: 5 },
  },
  { timestamps: { createdAt: false, updatedAt: true }, collection: "platformSettings" },
);

function model<T>(name: string, schema: Schema<T>) {
  return (mongoose.models[name] as Model<T> | undefined) || mongoose.model<T>(name, schema);
}

export const UserModel = model("User", userSchema);
export const BusinessModel = model("Business", businessSchema);
export const BranchModel = model("Branch", branchSchema);
export const OfferTemplateModel = model("OfferTemplate", templateSchema);
export const OfferModel = model("Offer", offerSchema);
export const FavoriteModel = model("Favorite", favoriteSchema);
export const RedemptionModel = model("Redemption", redemptionSchema);
export const ReportModel = model("Report", reportSchema);
export const ActivityLogModel = model("ActivityLog", activitySchema);
export const CategoryModel = model("Category", categorySchema);
export const PasswordResetModel = model("PasswordReset", passwordResetSchema);
export const RateLimitModel = model("RateLimit", rateLimitSchema);
export const PlatformSettingsModel = model("PlatformSettings", platformSettingsSchema);

export async function ensureModelIndexes() {
  await Promise.all([
    UserModel.createIndexes(),
    BusinessModel.createIndexes(),
    BranchModel.createIndexes(),
    OfferTemplateModel.createIndexes(),
    OfferModel.createIndexes(),
    FavoriteModel.createIndexes(),
    RedemptionModel.createIndexes(),
    ReportModel.createIndexes(),
    ActivityLogModel.createIndexes(),
    CategoryModel.createIndexes(),
    PasswordResetModel.createIndexes(),
    RateLimitModel.createIndexes(),
    PlatformSettingsModel.createIndexes(),
  ]);
}
