import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { dateInputToRange, shiftDateKey } from "@/lib/time";
import {
  ActivityLogModel,
  BranchModel,
  BusinessModel,
  CategoryModel,
  FavoriteModel,
  OfferModel,
  OfferTemplateModel,
  PlatformSettingsModel,
  RedemptionModel,
  ReportModel,
  UserModel,
} from "@/models";
import type { OpeningHours, Weekday } from "@/types/domain";

const TZ = "Asia/Kolkata";

function databaseName(uri: string) {
  const normalized = uri.replace(/^mongodb(\+srv)?:\/\//, "https://");
  return decodeURIComponent(new URL(normalized).pathname.replace(/^\//, ""));
}

function hours(): OpeningHours {
  const open = { closed: false, open: "09:00", close: "21:00" };
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as Weekday[];
  return Object.fromEntries(days.map((day) => [day, { ...open }])) as OpeningHours;
}

function range(dayOffsetStart: number, dayOffsetEnd: number) {
  return {
    validFrom: dateInputToRange(shiftDateKey(new Date(), dayOffsetStart, TZ), TZ).start,
    validUntil: dateInputToRange(shiftDateKey(new Date(), dayOffsetEnd, TZ), TZ).end,
  };
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Set MONGODB_URI before seeding.");
    process.exit(1);
  }
  const name = databaseName(uri);
  const looksLocal = /dev|test|local/i.test(name);
  if (process.env.NODE_ENV === "production" && process.env.SEED_CONFIRM !== "yes") {
    console.error("Refusing to seed while NODE_ENV is production. Set SEED_CONFIRM=yes only if this database is disposable.");
    process.exit(1);
  }
  if (process.env.SEED_RESET === "yes" && !looksLocal && process.env.SEED_CONFIRM !== "yes") {
    console.error(`Refusing to reset database "${name || "(default)"}". Its name does not include dev, test, or local.`);
    process.exit(1);
  }

  await connectDB();
  if (process.env.SEED_RESET === "yes") {
    await Promise.all([
      UserModel.deleteMany({}),
      BusinessModel.deleteMany({}),
      BranchModel.deleteMany({}),
      OfferTemplateModel.deleteMany({}),
      OfferModel.deleteMany({}),
      FavoriteModel.deleteMany({}),
      RedemptionModel.deleteMany({}),
      ReportModel.deleteMany({}),
      ActivityLogModel.deleteMany({}),
      CategoryModel.deleteMany({}),
      PlatformSettingsModel.deleteMany({}),
    ]);
  }

  const passwordHash = await hashPassword("OwnerPass!2026");
  const admin = await UserModel.findOneAndUpdate(
    { email: "admin@loco.local" },
    { name: "Loco Admin", email: "admin@loco.local", passwordHash: await hashPassword("LocoAdmin!2026"), role: "super_admin", isActive: true, sessionVersion: 0 },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
  const asha = await UserModel.findOneAndUpdate(
    { email: "asha@cedar.example" },
    { name: "Asha Menon", email: "asha@cedar.example", passwordHash, role: "owner", isActive: true, phone: "9845011122" },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
  const rohan = await UserModel.findOneAndUpdate(
    { email: "rohan@green.example" },
    { name: "Rohan Iyer", email: "rohan@green.example", passwordHash, role: "owner", isActive: true, phone: "9820099001" },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
  await UserModel.findOneAndUpdate(
    { email: "meera@customer.example" },
    { name: "Meera Shah", email: "meera@customer.example", passwordHash: await hashPassword("Customer!2026"), role: "customer", isActive: true },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
  const customer = await UserModel.findOne({ email: "meera@customer.example" });
  if (!admin || !asha || !rohan || !customer) throw new Error("Seed accounts were not created.");

  const categories = [
    ["Restaurants", "restaurants", "utensils", "Meals and daily restaurant specials."],
    ["Cafes", "cafes", "coffee", "Coffee, bakery counters, and cafe offers."],
    ["Supermarkets", "supermarkets", "basket", "Grocery and supermarket promotions."],
    ["Salons", "salons", "scissors", "Hair, beauty, and salon appointments."],
    ["Retail", "retail", "bag", "Shops and retail discounts."],
    ["Pharmacies", "pharmacies", "pill", "Pharmacy and wellness offers."],
    ["Bakeries", "bakeries", "croissant", "Fresh bakery and dessert offers."],
    ["Fitness", "fitness", "dumbbell", "Studios and fitness promotions."],
  ] as const;
  for (const [index, [name, slug, icon, description]] of categories.entries()) {
    await CategoryModel.findOneAndUpdate({ slug }, { name, slug, icon, description, isActive: true, sortOrder: index }, { upsert: true });
  }

  const layouts = [
    ["Classic poster", "classic", "#143f3b", "#f7f3ea", "#e25b2a", "#d7efe9", "serif"],
    ["Bold poster", "bold", "#1c1917", "#fff7ed", "#f97316", "#fdba74", "sans"],
    ["Minimal poster", "minimal", "#f7f3ea", "#142421", "#0f5c56", "#5f6b66", "sans"],
    ["Split poster", "split", "#0f5c56", "#f7f3ea", "#f4c95d", "#d7efe9", "serif"],
    ["Spice market", "market", "#fff4e8", "#3b2414", "#c45c26", "#8a6a52", "serif"],
    ["Midnight", "night", "#121418", "#f5f0e6", "#e4b15a", "#a39880", "sans"],
    ["Fresh", "fresh", "#f3f7ef", "#1c3324", "#2f6b45", "#5d6b5a", "sans"],
    ["Salon frame", "frame", "#fbf6f8", "#3d2433", "#9b4d6a", "#8d7380", "serif"],
    ["Ticket stub", "ticket", "#f4efe4", "#1f2933", "#c2410c", "#6b6258", "serif"],
  ] as const;
  const templates: Array<{ _id: mongoose.Types.ObjectId }> = [];
  for (const [name, layout, backgroundColor, textColor, accentColor, mutedColor, fontFamily] of layouts) {
    const template = await OfferTemplateModel.findOneAndUpdate(
      { name },
      {
        name,
        category: "all",
        layoutConfig: { layout, backgroundColor, textColor, accentColor, mutedColor, fontFamily, logoPosition: "top-left", showAddress: true, showValidity: true, showPrices: true },
        availableFields: ["title", "discount", "price", "validity", "address"],
        isActive: true,
        createdBy: admin._id,
      },
      { upsert: true, returnDocument: "after" },
    );
    templates.push(template);
  }

  const cedar = await BusinessModel.findOneAndUpdate(
    { slug: "cedar-kitchen" },
    { ownerId: asha._id, businessName: "Cedar Kitchen", slug: "cedar-kitchen", category: "restaurants", description: "A neighbourhood kitchen in Bengaluru serving lunch thalis and evening snacks.", contactPhone: "08041234567", isActive: true },
    { upsert: true, returnDocument: "after" },
  );
  const basket = await BusinessModel.findOneAndUpdate(
    { slug: "green-basket" },
    { ownerId: rohan._id, businessName: "Green Basket", slug: "green-basket", category: "supermarkets", description: "A supermarket with daily produce and grocery offers in Bandra.", contactPhone: "02226550011", isActive: true },
    { upsert: true, returnDocument: "after" },
  );
  const brew = await BusinessModel.findOneAndUpdate(
    { slug: "brew-room" },
    { ownerId: rohan._id, businessName: "Brew Room", slug: "brew-room", category: "cafes", description: "A Jubilee Hills cafe with weekday coffee and pastry offers.", contactPhone: "04023550022", isActive: true },
    { upsert: true, returnDocument: "after" },
  );

  async function branch(businessId: mongoose.Types.ObjectId, branchName: string, city: string, citySlug: string, area: string, pincode: string, state: string, lng: number, lat: number) {
    return BranchModel.findOneAndUpdate(
      { businessId, branchName },
      {
        businessId,
        branchName,
        address: { line1: `${area} main road`, area, city, citySlug, state, pincode, country: "India" },
        location: { type: "Point", coordinates: [lng, lat] },
        openingHours: hours(),
        phone: "9845000000",
        isActive: true,
      },
      { upsert: true, returnDocument: "after" },
    );
  }

  const indiranagar = await branch(cedar._id, "Indiranagar", "Bengaluru", "bengaluru", "Indiranagar", "560038", "Karnataka", 77.6408, 12.9784);
  const koramangala = await branch(cedar._id, "Koramangala", "Bengaluru", "bengaluru", "Koramangala", "560034", "Karnataka", 77.6245, 12.9352);
  const bandra = await branch(basket._id, "Bandra", "Mumbai", "mumbai", "Bandra West", "400050", "Maharashtra", 72.8296, 19.0596);
  const jubilee = await branch(brew._id, "Jubilee Hills", "Hyderabad", "hyderabad", "Jubilee Hills", "500033", "Telangana", 78.407, 17.4319);

  async function offer(input: {
    slug: string;
    title: string;
    businessId: mongoose.Types.ObjectId;
    branchId: mongoose.Types.ObjectId;
    coordinates: [number, number];
    offerType: "percentage" | "flat" | "bogo" | "special";
    status: "draft" | "published" | "paused";
    start: number;
    end: number;
    discountValue?: number;
    originalPrice?: number;
    discountedPrice?: number;
    viewsCount?: number;
    templateIndex: number;
  }) {
    const dates = range(input.start, input.end);
    return OfferModel.findOneAndUpdate(
      { slug: input.slug },
      {
        ...dates,
        businessId: input.businessId,
        branchId: input.branchId,
        templateId: templates[input.templateIndex]?._id,
        title: input.title,
        slug: input.slug,
        description: `${input.title} is available at the listed branch during the published dates. Ask the counter before you pay.`,
        offerType: input.offerType,
        discountValue: input.discountValue,
        originalPrice: input.originalPrice,
        discountedPrice: input.discountedPrice,
        activeDays: [],
        timezone: TZ,
        location: { type: "Point", coordinates: input.coordinates },
        status: input.status,
        termsAndConditions: "One offer per bill. Cannot be combined with another promotion.",
        redemptionLimit: 100,
        viewsCount: input.viewsCount ?? 0,
      },
      { upsert: true, returnDocument: "after" },
    );
  }

  const lunch = await offer({ slug: "cedar-lunch-thali", title: "Lunch thali at 20% off", businessId: cedar._id, branchId: indiranagar._id, coordinates: [77.6408, 12.9784], offerType: "percentage", status: "published", start: -1, end: 14, discountValue: 20, originalPrice: 250, discountedPrice: 200, viewsCount: 48, templateIndex: 0 });
  await offer({ slug: "cedar-evening-snacks", title: "Evening snacks ending soon", businessId: cedar._id, branchId: koramangala._id, coordinates: [77.6245, 12.9352], offerType: "percentage", status: "published", start: -2, end: 1, discountValue: 15, originalPrice: 180, discountedPrice: 153, viewsCount: 12, templateIndex: 1 });
  await offer({ slug: "cedar-weekend-draft", title: "Weekend family platter", businessId: cedar._id, branchId: indiranagar._id, coordinates: [77.6408, 12.9784], offerType: "special", status: "draft", start: 1, end: 20, originalPrice: 900, discountedPrice: 750, templateIndex: 2 });
  await offer({ slug: "cedar-expired-breakfast", title: "Breakfast combo", businessId: cedar._id, branchId: indiranagar._id, coordinates: [77.6408, 12.9784], offerType: "flat", status: "published", start: -10, end: -1, discountValue: 40, originalPrice: 160, discountedPrice: 120, viewsCount: 7, templateIndex: 3 });
  const basketOffer = await offer({ slug: "green-basket-produce", title: "Fresh produce flat discount", businessId: basket._id, branchId: bandra._id, coordinates: [72.8296, 19.0596], offerType: "flat", status: "published", start: -1, end: 7, discountValue: 50, originalPrice: 400, discountedPrice: 350, viewsCount: 22, templateIndex: 0 });
  await offer({ slug: "brew-room-paused", title: "Pastry with coffee", businessId: brew._id, branchId: jubilee._id, coordinates: [78.407, 17.4319], offerType: "bogo", status: "paused", start: -1, end: 10, viewsCount: 4, templateIndex: 1 });

  await FavoriteModel.updateOne({ userId: customer._id, offerId: lunch._id }, { userId: customer._id, offerId: lunch._id }, { upsert: true });
  await RedemptionModel.updateOne(
    { redemptionCode: "SEEDMEERA1" },
    { userId: customer._id, offerId: basketOffer._id, branchId: bandra._id, redemptionCode: "SEEDMEERA1", status: "claimed", claimedAt: new Date() },
    { upsert: true },
  );
  await ReportModel.updateOne(
    { userId: customer._id, offerId: lunch._id, status: "open" },
    { userId: customer._id, offerId: lunch._id, reason: "other", description: "The lunch counter was closed during the posted hours.", status: "open" },
    { upsert: true },
  );
  await PlatformSettingsModel.updateOne({ _id: "platform" }, { supportEmail: "support@loco.local", defaultRadiusKm: 5 }, { upsert: true });
  await ActivityLogModel.create({ actorId: admin._id, action: "seed.complete", resourceType: "platform", metadata: { environment: "development" } });

  console.log("Seeded development data.");
  console.log("Super admin: admin@loco.local / LocoAdmin!2026");
  console.log("Owners: asha@cedar.example and rohan@green.example / OwnerPass!2026");
  console.log("Customer: meera@customer.example / Customer!2026");
  await mongoose.disconnect();
}

main().catch(async (error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
