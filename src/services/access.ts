import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { BranchModel, BusinessModel, OfferModel, type BranchRecord, type BusinessRecord, type OfferRecord } from "@/models";

export function toObjectId(id: string, label = "Record") {
  if (!Types.ObjectId.isValid(id)) throw new AppError(404, "not_found", `${label} was not found.`);
  return new Types.ObjectId(id);
}

export async function requireOwnedBusiness(ownerId: string, businessId: string) {
  await connectDB();
  const business = await BusinessModel.findById(toObjectId(businessId, "Business"));
  if (!business || String(business.ownerId) !== ownerId) {
    throw new AppError(404, "not_found", "Business was not found.");
  }
  return business;
}

export async function requireOwnedBranch(ownerId: string, branchId: string) {
  await connectDB();
  const branch = await BranchModel.findById(toObjectId(branchId, "Branch"));
  if (!branch) throw new AppError(404, "not_found", "Branch was not found.");
  const business = await BusinessModel.findById(branch.businessId);
  if (!business || String(business.ownerId) !== ownerId) {
    throw new AppError(404, "not_found", "Branch was not found.");
  }
  return { branch, business };
}

export async function requireOwnedOffer(ownerId: string, offerId: string) {
  await connectDB();
  const offer = await OfferModel.findById(toObjectId(offerId, "Offer"));
  if (!offer) throw new AppError(404, "not_found", "Offer was not found.");
  const business = await BusinessModel.findById(offer.businessId);
  if (!business || String(business.ownerId) !== ownerId) {
    throw new AppError(404, "not_found", "Offer was not found.");
  }
  const branch = await BranchModel.findById(offer.branchId);
  if (!branch) throw new AppError(404, "not_found", "Offer was not found.");
  return { offer, business, branch };
}

export async function ownerBusinessIds(ownerId: string) {
  await connectDB();
  const businesses = await BusinessModel.find({ ownerId: toObjectId(ownerId, "User") }).select("_id");
  return businesses.map((business) => business._id);
}

export type { BranchRecord, BusinessRecord, OfferRecord };
