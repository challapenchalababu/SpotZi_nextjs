import { connectDB } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { toRedemption } from "@/lib/serialize";
import { BranchModel, BusinessModel, OfferModel, RedemptionModel, UserModel } from "@/models";
import type { RedemptionCheck } from "@/types/domain";

function normalizeRedemptionCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function verifyRedemptionCode(ownerId: string, rawCode: string): Promise<RedemptionCheck> {
  await connectDB();
  const code = normalizeRedemptionCode(rawCode);
  if (code.length < 4) throw new AppError(400, "invalid_code", "Enter the redemption code the customer shows you.");
  const redemption = await RedemptionModel.findOne({ redemptionCode: code }).lean();
  if (!redemption) {
    return { valid: false, reason: "not_found", message: "No redemption matches this code." };
  }
  const [offer, branch, customer] = await Promise.all([
    OfferModel.findById(redemption.offerId).lean(),
    BranchModel.findById(redemption.branchId).lean(),
    UserModel.findById(redemption.userId).select("name").lean(),
  ]);
  const business = offer ? await BusinessModel.findById(offer.businessId).select("ownerId businessName").lean() : null;
  if (!offer || !business || String(business.ownerId) !== ownerId) {
    return { valid: false, reason: "wrong_shop", message: "This code is not valid for your shop." };
  }
  const item = toRedemption(redemption, {
    offerTitle: offer.title,
    offerSlug: offer.slug,
    branchName: branch?.branchName || "Branch",
    businessName: business.businessName,
    customerName: customer?.name,
  });
  const customerName = item.customerName || "This customer";
  if (redemption.status === "claimed") {
    return { valid: true, reason: "claimed", message: `Valid. This code belongs to ${customerName}.`, redemption: item };
  }
  if (redemption.status === "redeemed") {
    return {
      valid: false,
      reason: "redeemed",
      message: `Already used. This code belonged to ${customerName} and has been redeemed.`,
      redemption: item,
    };
  }
  return { valid: false, reason: "cancelled", message: `Not valid. The code for ${customerName} was cancelled.`, redemption: item };
}
