import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { CategoryModel, OfferTemplateModel, UserModel } from "@/models";

const starterCategories = [
  ["Restaurants", "restaurants", "utensils", "Meals and daily restaurant specials."],
  ["Cafes", "cafes", "coffee", "Coffee, bakery counters, and cafe offers."],
  ["Supermarkets", "supermarkets", "basket", "Grocery and supermarket promotions."],
  ["Salons", "salons", "scissors", "Hair, beauty, and salon appointments."],
  ["Retail", "retail", "bag", "Shops and retail discounts."],
] as const;

async function ensureStarterCatalog(adminId: mongoose.Types.ObjectId) {
  for (const [index, [name, slug, icon, description]] of starterCategories.entries()) {
    await CategoryModel.findOneAndUpdate(
      { slug },
      { name, slug, icon, description, isActive: true, sortOrder: index },
      { upsert: true },
    );
  }
  const extraTemplates = [
    ["Spice market", "market", "#fff4e8", "#3b2414", "#c45c26", "#8a6a52", "serif", "top-left"],
    ["Midnight", "night", "#121418", "#f5f0e6", "#e4b15a", "#a39880", "sans", "top-center"],
    ["Fresh", "fresh", "#f3f7ef", "#1c3324", "#2f6b45", "#5d6b5a", "sans", "top-left"],
    ["Salon frame", "frame", "#fbf6f8", "#3d2433", "#9b4d6a", "#8d7380", "serif", "top-center"],
    ["Ticket stub", "ticket", "#f4efe4", "#1f2933", "#c2410c", "#6b6258", "serif", "top-left"],
  ] as const;
  for (const [name, layout, backgroundColor, textColor, accentColor, mutedColor, fontFamily, logoPosition] of extraTemplates) {
    await OfferTemplateModel.findOneAndUpdate(
      { name },
      {
        name,
        category: "all",
        layoutConfig: {
          layout,
          backgroundColor,
          textColor,
          accentColor,
          mutedColor,
          fontFamily,
          logoPosition,
          showAddress: true,
          showValidity: true,
          showPrices: true,
        },
        availableFields: ["title", "discount", "price", "validity", "address"],
        isActive: true,
        createdBy: adminId,
      },
      { upsert: true },
    );
  }
  await OfferTemplateModel.findOneAndUpdate(
    { name: "Classic poster" },
    {
      name: "Classic poster",
      category: "all",
      layoutConfig: {
        layout: "classic",
        backgroundColor: "#143f3b",
        textColor: "#f7f3ea",
        accentColor: "#e25b2a",
        mutedColor: "#d7efe9",
        fontFamily: "serif",
        logoPosition: "top-left",
        showAddress: true,
        showValidity: true,
        showPrices: true,
      },
      availableFields: ["title", "discount", "price", "validity", "address"],
      isActive: true,
      createdBy: adminId,
    },
    { upsert: true },
  );
}

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || "";
  const name = process.env.SEED_ADMIN_NAME?.trim() || "Super admin";
  if (!email || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password) || password.length < 10) {
    console.error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD. The password needs at least 10 characters, one letter, and one number.");
    process.exit(1);
  }
  await connectDB();
  const existing = await UserModel.findOne({ email }).select("+passwordHash");
  if (existing && existing.role !== "super_admin") {
    console.error("That email already belongs to a non-admin account. This script will not change its role.");
    process.exit(1);
  }
  const passwordHash = await hashPassword(password);
  const admin = existing ?? new UserModel({ email, role: "super_admin", sessionVersion: 0 });
  admin.name = name;
  admin.passwordHash = passwordHash;
  admin.isActive = true;
  admin.role = "super_admin";
  if (existing) admin.sessionVersion = (existing.sessionVersion ?? 0) + 1;
  await admin.save();
  await ensureStarterCatalog(admin._id);
  console.log(existing ? "Updated the super admin password and invalidated older sessions." : "Created a super admin account.");
  console.log("Sign in at /super-admin.");
  await mongoose.disconnect();
}

main().catch(async (error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
