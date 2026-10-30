import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgePercent,
  CalendarDays,
  Check,
  Coffee,
  MapPin,
  MapPinned,
  Scissors,
  Search,
  Shirt,
  ShoppingBasket,
  Smartphone,
  Store,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { TrackPageView } from "@/components/analytics/site-tracker";
import { BrandMark } from "@/components/brand-mark";
import { LandingHeader } from "@/components/marketing/landing-header";
import { BusinessLoginCta, FindOffersCta } from "@/components/marketing/tracked-ctas";

export const metadata: Metadata = {
  title: { absolute: "SpotZi | Nearby Deals. Happier You." },
  description: "Discover daily offers from nearby shops, restaurants, cafés, and supermarkets with SpotZi.",
  openGraph: {
    title: "SpotZi | Nearby Deals. Happier You.",
    description: "Discover daily offers from nearby shops, restaurants, cafés, and supermarkets with SpotZi.",
  },
};

const steps = [
  { icon: MapPin, title: "Choose Your Location", body: "Use your current location or select an area to explore offers around you." },
  { icon: Search, title: "Discover Local Offers", body: "Explore current promotions from nearby shops, cafés, restaurants, and supermarkets." },
  { icon: Store, title: "Visit and Save", body: "Check offer details, validity, and branch location before visiting the business." },
];

const categories: Array<{ name: string; description: string; icon: LucideIcon; href?: string }> = [
  { name: "Restaurants", description: "Meals and daily restaurant specials.", icon: UtensilsCrossed, href: "/categories/restaurants" },
  { name: "Cafés", description: "Coffee, bakery counters, and café offers.", icon: Coffee, href: "/categories/cafes" },
  { name: "Supermarkets", description: "Grocery and supermarket promotions.", icon: ShoppingBasket, href: "/categories/supermarkets" },
  { name: "Fashion", description: "Clothing and retail discounts from local shops.", icon: Shirt, href: "/categories/retail" },
  { name: "Electronics", description: "A place for gadget offers when local shops publish them.", icon: Smartphone },
  { name: "Beauty & Wellness", description: "Hair, beauty, and salon appointments.", icon: Scissors, href: "/categories/salons" },
  { name: "Groceries", description: "Everyday grocery offers from nearby supermarkets.", icon: ShoppingBasket, href: "/categories/supermarkets" },
  { name: "More Local Shops", description: "Browse every category of local business.", icon: Store, href: "/categories" },
];

const reasons = [
  { icon: MapPinned, title: "Nearby Discovery", body: "Explore offers relevant to your selected area." },
  { icon: CalendarDays, title: "Daily Opportunities", body: "Discover offers that are active today and offers starting later." },
  { icon: Store, title: "Local Business Support", body: "Find promotions from businesses in your community." },
  { icon: Search, title: "Easy Exploration", body: "Search offers and businesses from one place." },
];

const ownerBenefits = [
  "Create and manage promotional offers.",
  "Reuse promotional templates.",
  "Manage multiple business branches.",
  "Track offer views and saves.",
  "Review redemptions and customer reports.",
];

export default function LandingPage() {
  return (
    <div className="landing min-h-screen bg-[#F5FAF7] text-[#103B3A]">
      <TrackPageView event="landing_view" />
      <LandingHeader />
      <main id="content">
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
          <div>
            <p className="text-xs font-semibold tracking-wide text-[#168747] sm:tracking-[0.18em]">LOCAL DEALS. BETTER SAVINGS.</p>
            <h1 className="mt-3 max-w-xl text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">Great deals are closer than you think.</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#103B3A]/80">Discover offers from nearby restaurants, cafés, supermarkets, clothing stores, and your favorite local shops. Find today&apos;s deals and enjoy more savings around you.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <FindOffersCta />
              <BusinessLoginCta label="Have a Business?" />
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
            <div className="rounded-3xl border border-[#168747]/20 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <MapPin className="size-4 text-[#168747]" />
                  Offer discovery
                </div>
                <div className="flex gap-2">
                  <span className="rounded-full bg-[#FF6B32] px-3 py-1 text-xs font-semibold text-white">Nearby</span>
                  <span className="rounded-full bg-[#168747] px-3 py-1 text-xs font-semibold text-white">Today</span>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  ["Restaurants", "Today’s meals nearby"],
                  ["Cafés", "Coffee and bakery counters"],
                  ["Supermarkets", "Grocery promotions"],
                ].map(([title, detail]) => (
                  <div key={title} className="flex items-center justify-between rounded-2xl border border-[#168747]/15 bg-[#F5FAF7] px-4 py-3">
                    <div>
                      <p className="font-semibold">{title}</p>
                      <p className="text-xs text-[#103B3A]/70">{detail}</p>
                    </div>
                    <BadgePercent className="size-5 text-[#FF6B32]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-24 mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-2xl font-semibold sm:text-3xl">Local deals in three simple steps</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, index) => (
              <article key={step.title} className="rounded-3xl border border-[#168747]/20 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#168747]/40">
                <step.icon className="size-6 text-[#168747]" aria-hidden="true" />
                <p className="mt-4 text-xs font-semibold tracking-wide text-[#168747]">Step {index + 1}</p>
                <h3 className="mt-1 text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#103B3A]/75">{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="categories" className="scroll-mt-24 mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-2xl font-semibold sm:text-3xl">Discover offers for everyday shopping</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => {
              const body = (
                <>
                  <category.icon className="size-6 text-[#168747]" aria-hidden="true" />
                  <h3 className="mt-3 text-lg font-semibold">{category.name}</h3>
                  <p className="mt-1 text-sm leading-6 text-[#103B3A]/75">{category.description}</p>
                </>
              );
              const className = "rounded-3xl border border-[#168747]/20 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#168747]/40";
              return category.href ? (
                <Link key={category.name} href={category.href} className={className}>{body}</Link>
              ) : (
                <article key={category.name} className={className}>{body}</article>
              );
            })}
          </div>
        </section>

        <section id="for-businesses" className="scroll-mt-24 bg-[#e7f6ec]">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold sm:text-3xl">Own a local business?</h2>
              <p className="mt-3 max-w-xl leading-7 text-[#103B3A]/80">Bring your offers closer to customers. Create promotions, manage your business branches, and help nearby shoppers discover what you offer.</p>
              <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <BusinessLoginCta label="Grow Your Business" solid />
                <Link href="/owner/login" className="text-sm font-semibold text-[#168747] underline-offset-4 hover:underline">Already registered? Log in</Link>
              </div>
            </div>
            <ul className="space-y-3">
              {ownerBenefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 rounded-2xl border border-[#168747]/15 bg-white px-4 py-3 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-[#168747]" aria-hidden="true" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-semibold sm:text-3xl">Why choose SpotZi?</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {reasons.map((reason) => (
              <article key={reason.title} className="rounded-3xl border border-[#168747]/20 bg-white p-5 shadow-sm">
                <reason.icon className="size-6 text-[#168747]" aria-hidden="true" />
                <h3 className="mt-3 text-xl font-semibold">{reason.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#103B3A]/75">{reason.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="rounded-3xl border border-[#168747]/20 bg-white px-6 py-10 text-center shadow-sm sm:px-10">
            <h2 className="text-2xl font-semibold sm:text-3xl">Your next great deal is nearby.</h2>
            <p className="mx-auto mt-3 max-w-xl text-[#103B3A]/80">Start exploring local offers and discover more ways to save.</p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <FindOffersCta />
              <BusinessLoginCta label="List Your Business" />
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-[#168747]/15">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-8 px-4 py-8 lg:grid-cols-3">
          <div className="col-span-2 lg:col-span-1">
            <BrandMark />
          </div>
          <div className="min-w-0 space-y-2 text-sm">
            <p className="font-semibold">Explore</p>
            <Link className="block hover:underline" href="/">Home</Link>
            <Link className="block hover:underline" href="/offers">Find Offers</Link>
            <a className="block hover:underline" href="#how-it-works">How It Works</a>
          </div>
          <div className="min-w-0 space-y-2 text-sm">
            <p className="font-semibold">Business</p>
            <Link className="block hover:underline" href="/owner/login">Have a Business?</Link>
            <Link className="block hover:underline" href="/privacy-policy">Privacy policy</Link>
            <Link className="block hover:underline" href="/terms-and-conditions">Terms and conditions</Link>
          </div>
        </div>
        <p className="border-t border-[#168747]/10 px-4 py-4 text-center text-xs text-[#103B3A]/70">© {new Date().getFullYear()} SpotZi. Nearby Deals. Happier You.</p>
      </footer>
    </div>
  );
}
