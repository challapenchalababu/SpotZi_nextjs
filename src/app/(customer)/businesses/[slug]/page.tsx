import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OfferGrid } from "@/components/customer/offer-card";
import { JsonLd } from "@/components/seo";
import { EmptyState } from "@/components/ui/primitives";
import { getAppUrl } from "@/lib/env";
import { directionsUrl, formatAddress, weekdayLabel } from "@/lib/format";
import { getBusinessProfile } from "@/services/catalog.service";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getBusinessProfile(slug).catch(() => null);
  if (!profile) return { title: "Business", robots: { index: false } };
  return {
    title: profile.business.businessName,
    description: profile.business.description.slice(0, 155),
    alternates: { canonical: `/businesses/${profile.business.slug}` },
    openGraph: { title: profile.business.businessName, description: profile.business.description.slice(0, 155), images: profile.business.logoUrl ? [{ url: profile.business.logoUrl, alt: `${profile.business.businessName} logo` }] : undefined },
  };
}

export default async function BusinessPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getBusinessProfile(slug);
  if (!profile) notFound();
  const { business, branches, offers } = profile;
  const primary = branches[0];
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.businessName,
    description: business.description,
    url: `${getAppUrl()}/businesses/${business.slug}`,
    ...(business.logoUrl ? { image: business.logoUrl } : {}),
    ...(business.contactPhone ? { telephone: business.contactPhone } : {}),
    ...(primary ? { address: { "@type": "PostalAddress", streetAddress: primary.address.line1, addressLocality: primary.address.city, postalCode: primary.address.pincode, addressCountry: primary.address.country } } : {}),
  };
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <JsonLd data={jsonLd} />
      <header>
        <p className="text-sm uppercase tracking-wide text-muted-foreground">{business.categoryName || business.category}</p>
        <h1 className="display text-4xl">{business.businessName}</h1>
        <p className="mt-3 max-w-3xl leading-7">{business.description}</p>
        {business.website ? <a className="mt-3 inline-block text-sm font-semibold text-primary" href={business.website} rel="noreferrer">Website</a> : null}
      </header>
      <section className="grid gap-3 md:grid-cols-2">
        {branches.map((branch) => (
          <div key={branch.id} className="rounded-2xl border border-border bg-card p-4">
            <h2 className="font-semibold">{branch.branchName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{formatAddress(branch.address)}</p>
            {branch.phone ? <p className="text-sm">{branch.phone}</p> : null}
            <a className="mt-2 inline-block text-sm font-semibold text-primary" href={directionsUrl(branch.latitude, branch.longitude)}>Directions</a>
            <ul className="mt-3 space-y-1 text-sm">
              {Object.entries(branch.openingHours).map(([day, hours]) => <li key={day} className="flex justify-between"><span>{weekdayLabel(day)}</span><span>{hours.closed ? "Closed" : `${hours.open}–${hours.close}`}</span></li>)}
            </ul>
          </div>
        ))}
      </section>
      <section className="space-y-4">
        <h2 className="display text-3xl">Current offers</h2>
        {offers.length ? <OfferGrid offers={offers} /> : <EmptyState title="No active offers" body="This business does not have a published offer in its current validity window." />}
      </section>
    </div>
  );
}
