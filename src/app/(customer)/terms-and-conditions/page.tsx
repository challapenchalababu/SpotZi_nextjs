export const metadata = { title: "Terms and conditions", description: "Terms for using SpotZi to browse and publish local offers." };

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-4 px-4 py-10 leading-7">
      <h1 className="display text-4xl">Terms and conditions</h1>
      <p>SpotZi is a directory of offers published by participating businesses. An offer listing is not a guarantee that the promotion will be honored. Each offer page shows the business terms, dates, and branch.</p>
      <p>Customers must provide accurate account information. Claiming an offer creates a redemption code that is unique to that customer. The shop checks the code against the customer before honoring it, and decides when that code has been used.</p>
      <p>Business owners are responsible for the offers, prices, posters, and locations they publish. They may only manage businesses, branches, and offers that belong to their account.</p>
      <p>Super admin access is provisioned separately and is not available through public registration. Misuse of another account, or attempts to change your own role, is not permitted.</p>
      <p>Subscription billing is not part of this application until a payment provider is configured. Do not treat any dashboard as a record of charges.</p>
    </article>
  );
}
