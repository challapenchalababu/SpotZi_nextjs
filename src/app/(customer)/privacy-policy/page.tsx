export const metadata = { title: "Privacy policy", description: "How SpotZi uses account details, location, and offer data." };

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-4 px-4 py-10 leading-7">
      <h1 className="display text-4xl">Privacy policy</h1>
      <p>SpotZi helps people find daily offers from nearby businesses. This policy describes the information the application actually stores.</p>
      <h2 className="text-2xl font-semibold">Accounts</h2>
      <p>If you register, we store your name, email address, optional phone number, and a hashed password. We do not store the original password. Session cookies are HTTP-only.</p>
      <h2 className="text-2xl font-semibold">Location</h2>
      <p>The site asks for browser location only after you choose “Use my location”. That choice explains why the location is needed: to search for offers within a radius you select. SpotZi does not continuously track your position. Coordinates are kept in this browser session and are not placed in public page URLs, page titles, or the application activity log. If you decline location access, you can search by city, area, or pincode instead.</p>
      <h2 className="text-2xl font-semibold">Offers and reports</h2>
      <p>Saving an offer, claiming a redemption, or reporting an offer stores the link between your account and that offer, plus the report text you submit. Redemption codes are shown to you and to the business that published the offer.</p>
      <h2 className="text-2xl font-semibold">Business content</h2>
      <p>Business owners provide profile details, branch addresses, coordinates, opening hours, and promotional images. Images are stored in Cloudinary when those credentials are configured, or in local development storage otherwise.</p>
    </article>
  );
}
