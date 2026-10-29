import { DEFAULT_TIMEZONE } from "@/lib/env";
import type { Weekday } from "@/types/domain";

export function isValidTimeZone(timeZone: string) {
  try {
    Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  const hour = parts.hour === "24" ? 0 : Number(parts.hour);
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    hour,
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - date.getTime();
}

export function zonedTimeToUtc(dateTime: string, timeZone: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(dateTime);
  if (!match || !isValidTimeZone(timeZone)) {
    throw new Error("Invalid local date or time zone.");
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? 0);
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  const firstPass = new Date(utcGuess - getTimeZoneOffsetMs(new Date(utcGuess), timeZone));
  return new Date(utcGuess - getTimeZoneOffsetMs(firstPass, timeZone));
}

export function getZonedParts(date: Date, timeZone: string) {
  const zone = isValidTimeZone(timeZone) ? timeZone : "UTC";
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hourCycle: "h23",
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  const hour = parts.hour === "24" ? 0 : Number(parts.hour);
  return {
    weekday: parts.weekday.toLowerCase() as Weekday,
    minutes: hour * 60 + Number(parts.minute),
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

export function parseClock(value: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function dateInputToRange(date: string, timeZone = DEFAULT_TIMEZONE) {
  return {
    start: zonedTimeToUtc(`${date}T00:00:00`, timeZone),
    end: zonedTimeToUtc(`${date}T23:59:59`, timeZone),
  };
}

export function shiftDateKey(date: Date, days: number, timeZone = DEFAULT_TIMEZONE) {
  const parts = getZonedParts(date, timeZone);
  const base = zonedTimeToUtc(`${parts.dateKey}T12:00:00`, timeZone);
  const shifted = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
  return getZonedParts(shifted, timeZone).dateKey;
}
