import { z } from "zod";
import { isValidTimeZone } from "@/lib/time";
import {
  OFFER_STATUSES,
  OFFER_TYPES,
  PORTALS,
  POSTER_LAYOUTS,
  REPORT_REASONS,
  REPORT_STATUSES,
  WEEKDAYS,
} from "@/types/domain";

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(72, "Use at most 72 characters.")
  .regex(/[A-Za-z]/, "Include at least one letter.")
  .regex(/[0-9]/, "Include at least one number.");

const phoneSchema = z
  .string()
  .trim()
  .regex(/^[0-9+\-\s()]{8,20}$/, "Enter a valid phone number.");

const optionalPhone = z.union([z.literal(""), phoneSchema]).optional();

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "Enter a valid http or https URL.");

const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color like #0f5c56.");
const clockSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM.");
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date.");

function emptyNumber(value: unknown) {
  if (value === "" || value == null) return undefined;
  if (typeof value === "number" && Number.isNaN(value)) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}

const optionalPrice = z.preprocess(emptyNumber, z.number().min(0).max(1_000_000).optional());
const optionalLimit = z.preprocess(emptyNumber, z.number().int().min(1).max(100_000).optional());

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80),
  email: z.email("Enter a valid email address."),
  password: passwordSchema,
  phone: optionalPhone,
  accountType: z.enum(["customer", "owner"]),
});

export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password.").max(72),
  portal: z.enum(PORTALS),
  next: z.string().max(200).optional(),
});

export const forgotSchema = z.object({
  email: z.email("Enter a valid email address."),
});

export const resetSchema = z.object({
  token: z.string().min(20).max(200),
  password: passwordSchema,
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: optionalPhone,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(72),
  newPassword: passwordSchema,
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Enter your password.").max(72),
  confirmation: z
    .string()
    .trim()
    .refine((value) => value === "DELETE", "Type DELETE to confirm."),
});

export const userStatusSchema = z.object({
  isActive: z.boolean(),
});

const daySchema = z.object({
  closed: z.boolean(),
  open: clockSchema,
  close: clockSchema,
});

export const openingHoursSchema = z.object({
  monday: daySchema,
  tuesday: daySchema,
  wednesday: daySchema,
  thursday: daySchema,
  friday: daySchema,
  saturday: daySchema,
  sunday: daySchema,
});

export const businessSchema = z.object({
  businessName: z.string().trim().min(2).max(80),
  category: z.string().trim().min(2).max(60),
  description: z.string().trim().min(20).max(2000),
  logoUrl: z.string().trim().max(500).optional().or(z.literal("")),
  contactPhone: optionalPhone,
  website: optionalUrl,
  isActive: z.boolean().optional(),
});

export const branchSchema = z.object({
  businessId: z.string().min(1),
  branchName: z.string().trim().min(2).max(80),
  address: z.object({
    line1: z.string().trim().min(3).max(160),
    line2: z.string().trim().max(160).optional().or(z.literal("")),
    area: z.string().trim().min(2).max(80),
    city: z.string().trim().min(2).max(80),
    state: z.string().trim().max(80).optional().or(z.literal("")),
    pincode: z.string().trim().regex(/^[A-Za-z0-9 -]{3,12}$/, "Enter a valid pincode."),
    country: z.string().trim().min(2).max(60),
  }),
  latitude: z.preprocess(emptyNumber, z.number().min(-90).max(90)),
  longitude: z.preprocess(emptyNumber, z.number().min(-180).max(180)),
  phone: optionalPhone,
  openingHours: openingHoursSchema,
  isActive: z.boolean().optional(),
});

export const layoutConfigSchema = z.object({
  layout: z.enum(POSTER_LAYOUTS),
  backgroundColor: colorSchema,
  textColor: colorSchema,
  accentColor: colorSchema,
  mutedColor: colorSchema,
  fontFamily: z.enum(["sans", "serif"]),
  logoPosition: z.enum(["top-left", "top-center", "top-right"]),
  showAddress: z.boolean(),
  showValidity: z.boolean(),
  showPrices: z.boolean(),
});

export const templateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  category: z.string().trim().min(2).max(60),
  thumbnailUrl: z.string().trim().max(500).optional().or(z.literal("")),
  backgroundUrl: z.string().trim().max(500).optional().or(z.literal("")),
  layoutConfig: layoutConfigSchema,
  availableFields: z.array(z.string().trim().min(1).max(40)).max(20),
  isActive: z.boolean().default(true),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(40),
  icon: z.string().trim().min(2).max(40),
  description: z.string().trim().min(10).max(300),
  isActive: z.boolean().default(true),
  sortOrder: z.preprocess(emptyNumber, z.number().int().min(0).max(999).default(0)),
});

const offerFields = {
  businessId: z.string().min(1),
  templateId: z.string().min(1),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(2000),
  offerType: z.enum(OFFER_TYPES),
  discountValue: optionalPrice,
  originalPrice: optionalPrice,
  discountedPrice: optionalPrice,
  posterUrl: z.string().trim().max(500).optional().or(z.literal("")),
  validFrom: dateSchema,
  validUntil: dateSchema,
  activeDays: z.array(z.enum(WEEKDAYS)).max(7),
  startTime: z.union([z.literal(""), clockSchema]).optional(),
  endTime: z.union([z.literal(""), clockSchema]).optional(),
  timezone: z.string().trim().min(1).max(80),
  termsAndConditions: z.string().trim().max(2000).optional().or(z.literal("")),
  redemptionLimit: optionalLimit,
  status: z.enum(["draft", "published"]),
};

function refineOffer(data: {
  validFrom: string;
  validUntil: string;
  startTime?: string;
  endTime?: string;
  timezone: string;
  offerType: string;
  discountValue?: number;
  originalPrice?: number;
  discountedPrice?: number;
  status: string;
  description: string;
  termsAndConditions?: string;
}, ctx: z.RefinementCtx) {
  if (data.validUntil < data.validFrom) {
    ctx.addIssue({ code: "custom", message: "The end date must be on or after the start date.", path: ["validUntil"] });
  }
  if (!isValidTimeZone(data.timezone)) {
    ctx.addIssue({ code: "custom", message: "Choose a valid time zone.", path: ["timezone"] });
  }
  const start = data.startTime || "";
  const end = data.endTime || "";
  if ((start && !end) || (!start && end)) {
    ctx.addIssue({ code: "custom", message: "Enter both a start and end time, or leave both empty.", path: ["endTime"] });
  }
  if (data.offerType === "percentage" && (data.discountValue == null || data.discountValue < 1 || data.discountValue > 100)) {
    ctx.addIssue({ code: "custom", message: "Percentage discounts must be from 1 to 100.", path: ["discountValue"] });
  }
  if (data.offerType === "flat" && (data.discountValue == null || data.discountValue <= 0)) {
    ctx.addIssue({ code: "custom", message: "Enter a flat discount greater than zero.", path: ["discountValue"] });
  }
  if (
    data.offerType === "flat" &&
    data.originalPrice != null &&
    data.discountValue != null &&
    data.discountValue >= data.originalPrice
  ) {
    ctx.addIssue({ code: "custom", message: "A flat discount must be lower than the original price.", path: ["discountValue"] });
  }
  if (data.originalPrice != null && data.discountedPrice != null && data.discountedPrice > data.originalPrice) {
    ctx.addIssue({
      code: "custom",
      message: "The discounted price cannot be higher than the original price.",
      path: ["discountedPrice"],
    });
  }
  if (data.status === "published" && data.description.trim().length < 20) {
    ctx.addIssue({ code: "custom", message: "Write at least 20 characters before publishing.", path: ["description"] });
  }
  if (data.status === "published" && (data.termsAndConditions || "").trim().length < 10) {
    ctx.addIssue({ code: "custom", message: "Add terms and conditions before publishing.", path: ["termsAndConditions"] });
  }
}

export const createOfferSchema = z
  .object({ ...offerFields, branchIds: z.array(z.string().min(1)).min(1).max(20) })
  .superRefine(refineOffer);

export const updateOfferSchema = z
  .object({ ...offerFields, branchId: z.string().min(1) })
  .superRefine(refineOffer);

export const offerStatusSchema = z.object({
  status: z.enum(OFFER_STATUSES),
});

export const adminOfferStatusSchema = z.object({
  status: z.enum(["paused", "archived"]),
});

export const activeFlagSchema = z.object({
  isActive: z.boolean(),
});

export const reportSchema = z.object({
  offerId: z.string().min(1),
  reason: z.enum(REPORT_REASONS),
  description: z.string().trim().min(10).max(1000),
});

export const reportUpdateSchema = z.object({
  status: z.enum(REPORT_STATUSES),
  resolutionNote: z.string().trim().max(500).optional().or(z.literal("")),
});

export const redemptionSchema = z.object({
  offerId: z.string().min(1),
});

export const redemptionUpdateSchema = z.object({
  status: z.enum(["redeemed", "cancelled"]),
});

export const redemptionVerifySchema = z.object({
  code: z.string().trim().min(4).max(32),
});

export const settingsSchema = z.object({
  supportEmail: z.union([z.literal(""), z.email("Enter a valid support email.")]),
  defaultRadiusKm: z.preprocess(emptyNumber, z.number().min(1).max(100)),
});

export const listQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.string().trim().max(40).optional(),
  category: z.string().trim().max(60).optional(),
  city: z.string().trim().max(80).optional(),
  area: z.string().trim().max(80).optional(),
  pincode: z.string().trim().max(12).optional(),
  offerType: z.enum(OFFER_TYPES).optional(),
  discountMin: z.coerce.number().min(0).max(100).optional(),
  sort: z.enum(["newest", "discount", "ending", "distance"]).optional(),
  currentlyAvailable: z.enum(["true", "false"]).optional(),
  mine: z.enum(["true", "false"]).optional(),
  businessId: z.string().trim().optional(),
  role: z.enum(["customer", "owner", "super_admin"]).optional(),
  isActive: z.enum(["true", "false"]).optional(),
  includeInactive: z.enum(["true", "false"]).optional(),
});

export const nearbyQuerySchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  radiusKm: z.coerce.number().default(5),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(24).default(12),
  sort: z.enum(["distance", "newest", "discount"]).default("distance"),
  category: z.string().trim().max(60).optional(),
  offerType: z.enum(OFFER_TYPES).optional(),
  q: z.string().trim().max(80).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type ResetInput = z.infer<typeof resetSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
export type BusinessInput = z.infer<typeof businessSchema>;
export type BranchInput = z.infer<typeof branchSchema>;
export type CreateOfferInput = z.infer<typeof createOfferSchema>;
export type UpdateOfferInput = z.infer<typeof updateOfferSchema>;
export type TemplateInput = z.infer<typeof templateSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
