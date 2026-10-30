import { connectDB } from "@/lib/db";
import { isPreviewMode } from "@/lib/env";
import { SITE_EVENTS, SITE_EVENT_LABELS, type SiteEvent } from "@/lib/site-events";
import { SiteTrafficCounterModel, SiteTrafficDailyModel, SiteUniqueVisitModel } from "@/models";

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function emptyTotals() {
  return Object.fromEntries(SITE_EVENTS.map((event) => [event, { hits: 0, uniqueVisitors: 0 }])) as Record<
    SiteEvent,
    { hits: number; uniqueVisitors: number }
  >;
}

export async function trackSiteEvent(event: SiteEvent, visitorKey: string) {
  if (isPreviewMode()) return { ok: true as const };
  const key = visitorKey.trim().slice(0, 80);
  if (!key) return { ok: true as const };

  await connectDB();
  const day = todayKey();

  await SiteTrafficCounterModel.updateOne(
    { _id: event },
    { $inc: { totalHits: 1 }, $setOnInsert: { uniqueVisitors: 0 } },
    { upsert: true },
  );
  await SiteTrafficDailyModel.updateOne({ day, event }, { $inc: { hits: 1 }, $setOnInsert: { uniqueVisitors: 0 } }, { upsert: true });

  try {
    await SiteUniqueVisitModel.create({ event, visitorKey: key, day });
    await Promise.all([
      SiteTrafficCounterModel.updateOne({ _id: event }, { $inc: { uniqueVisitors: 1 } }),
      SiteTrafficDailyModel.updateOne({ day, event }, { $inc: { uniqueVisitors: 1 } }),
    ]);
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? Number((error as { code?: number }).code) : 0;
    if (code !== 11000) throw error;
  }

  return { ok: true as const };
}

export async function getSiteTrafficSummary(days = 14) {
  if (isPreviewMode()) {
    return {
      totals: emptyTotals(),
      today: emptyTotals(),
      daily: [] as Array<{ day: string; event: SiteEvent; hits: number; uniqueVisitors: number }>,
      labels: SITE_EVENT_LABELS,
    };
  }

  await connectDB();
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - Math.max(1, days - 1));
  const sinceDay = todayKey(since);
  const today = todayKey();

  const [counters, dailyDocs, todayDocs] = await Promise.all([
    SiteTrafficCounterModel.find({ _id: { $in: [...SITE_EVENTS] } }).lean(),
    SiteTrafficDailyModel.find({ day: { $gte: sinceDay } }).sort({ day: -1 }).lean(),
    SiteTrafficDailyModel.find({ day: today }).lean(),
  ]);

  const totals = emptyTotals();
  for (const counter of counters) {
    const event = counter._id as SiteEvent;
    if (!SITE_EVENTS.includes(event)) continue;
    totals[event] = { hits: counter.totalHits || 0, uniqueVisitors: counter.uniqueVisitors || 0 };
  }

  const todayTotals = emptyTotals();
  for (const row of todayDocs) {
    const event = row.event as SiteEvent;
    if (!SITE_EVENTS.includes(event)) continue;
    todayTotals[event] = { hits: row.hits || 0, uniqueVisitors: row.uniqueVisitors || 0 };
  }

  return {
    totals,
    today: todayTotals,
    daily: dailyDocs
      .filter((row) => SITE_EVENTS.includes(row.event as SiteEvent))
      .map((row) => ({
        day: row.day,
        event: row.event as SiteEvent,
        hits: row.hits || 0,
        uniqueVisitors: row.uniqueVisitors || 0,
      })),
    labels: SITE_EVENT_LABELS,
  };
}
