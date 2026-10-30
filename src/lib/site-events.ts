export const SITE_EVENTS = [
  "landing_view",
  "find_offers_click",
  "offers_page_view",
  "business_login_view",
] as const;

export type SiteEvent = (typeof SITE_EVENTS)[number];

export const SITE_EVENT_LABELS: Record<SiteEvent, string> = {
  landing_view: "Website opens (landing)",
  find_offers_click: "Find Offers clicks",
  offers_page_view: "Offers page visits",
  business_login_view: "Business login page visits",
};

export function isSiteEvent(value: string): value is SiteEvent {
  return (SITE_EVENTS as readonly string[]).includes(value);
}
