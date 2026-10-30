import { WEEKDAYS, type OpeningHours, type Weekday } from "@/types/domain";

/** 15-minute clock options in HH:MM for opening-hours selects. */
export const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, index) => {
  const hours = Math.floor(index / 4);
  const minutes = (index % 4) * 15;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
});

export function defaultOpeningHours(): OpeningHours {
  return WEEKDAYS.reduce((hours, day) => {
    hours[day] = { closed: false, open: "09:00", close: "21:00" };
    return hours;
  }, {} as OpeningHours);
}

export function normalizeOpeningHours(value?: Partial<OpeningHours> | null): OpeningHours {
  const hours = defaultOpeningHours();
  if (!value) return hours;
  for (const day of WEEKDAYS) {
    const incoming = value[day];
    if (!incoming) continue;
    hours[day] = {
      closed: Boolean(incoming.closed),
      open: incoming.open || "09:00",
      close: incoming.close || "21:00",
    };
  }
  return hours;
}

export function dayKey(day: Weekday) {
  return day;
}
