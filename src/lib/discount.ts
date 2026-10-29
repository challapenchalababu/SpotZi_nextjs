import { formatMoney } from "@/lib/format";
import type { OfferType } from "@/types/domain";

export function discountLabel(offer: { offerType: OfferType; discountValue?: number | null }) {
  if (offer.offerType === "percentage" && offer.discountValue) return `${offer.discountValue}% off`;
  if (offer.offerType === "flat" && offer.discountValue) return `${formatMoney(offer.discountValue)} off`;
  if (offer.offerType === "bogo") return "Buy 1, get 1";
  return "Special offer";
}

export function discountScore(offer: {
  offerType: OfferType;
  discountValue?: number | null;
  originalPrice?: number | null;
  discountedPrice?: number | null;
}) {
  if (offer.offerType === "percentage") return offer.discountValue ?? 0;
  if (offer.offerType === "flat" && offer.originalPrice && offer.discountValue) {
    return (offer.discountValue / offer.originalPrice) * 100;
  }
  if (offer.offerType === "bogo") return 50;
  if (offer.originalPrice && offer.discountedPrice != null && offer.originalPrice > 0) {
    return ((offer.originalPrice - offer.discountedPrice) / offer.originalPrice) * 100;
  }
  return 0;
}
