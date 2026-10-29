export const metadata = { title: "Revenue" };

export default function RevenuePage() {
  return (
    <div className="space-y-3">
      <h1 className="display text-4xl">Revenue</h1>
      <p className="max-w-2xl text-sm text-muted-foreground">Subscription billing is not enabled. This page does not show charges, invoices, or estimated revenue because no payment provider is connected.</p>
    </div>
  );
}
