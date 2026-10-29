import { getZonedParts, isValidTimeZone, parseClock } from "@/lib/time";
import type { Availability, OfferStatus, Weekday } from "@/types/domain";

export interface ScheduleInput {
  status: OfferStatus;
  validFrom: Date | string;
  validUntil: Date | string;
  activeDays?: Weekday[];
  startTime?: string | null;
  endTime?: string | null;
  timezone: string;
}

export function isWithinValidityDates(offer: ScheduleInput, now = new Date()) {
  const current = now.getTime();
  return current >= new Date(offer.validFrom).getTime() && current <= new Date(offer.validUntil).getTime();
}

export function isWithinSchedule(offer: ScheduleInput, now = new Date()) {
  if (offer.status !== "published" || !isWithinValidityDates(offer, now)) return false;
  const zone = isValidTimeZone(offer.timezone) ? offer.timezone : "UTC";
  const parts = getZonedParts(now, zone);
  if (offer.activeDays && offer.activeDays.length > 0 && !offer.activeDays.includes(parts.weekday)) {
    return false;
  }
  if (!offer.startTime || !offer.endTime) return true;
  const start = parseClock(offer.startTime);
  const end = parseClock(offer.endTime);
  if (start == null || end == null) return false;
  if (start <= end) return parts.minutes >= start && parts.minutes <= end;
  return parts.minutes >= start || parts.minutes <= end;
}

export function availabilityOf(offer: ScheduleInput, now = new Date()): Availability {
  if (offer.status === "draft" || offer.status === "paused" || offer.status === "archived") {
    return offer.status;
  }
  const current = now.getTime();
  if (current > new Date(offer.validUntil).getTime()) return "expired";
  if (current < new Date(offer.validFrom).getTime()) return "scheduled";
  return "active";
}
