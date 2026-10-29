import { WEEKDAYS, type OpeningHours, type Weekday } from "@/types/domain";

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
