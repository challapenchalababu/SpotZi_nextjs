import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/primitives";
import { getSession } from "@/lib/session";
import { listOwnerBusinesses } from "@/services/business.service";

export const metadata = { title: "Businesses" };

export default async function OwnerBusinessesPage() {
  const session = await getSession();
  if (!session) redirect("/owner/login");
  const businesses = await listOwnerBusinesses(session.id);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="display text-4xl">Businesses</h1>
        <Link className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" href="/owner/businesses/create">Add business</Link>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground"><tr><th className="px-4 py-3">Name</th><th>Category</th><th>Status</th></tr></thead>
          <tbody>
            {businesses.map((business) => (
              <tr key={business.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3"><Link className="font-medium" href={`/owner/businesses/${business.id}`}>{business.businessName}</Link></td>
                <td>{business.categoryName || business.category}</td>
                <td><Badge tone={business.isActive ? "success" : "warning"}>{business.isActive ? "Active" : "Disabled"}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
        {businesses.length === 0 ? <p className="px-4 py-6 text-sm text-muted-foreground">Create a business before adding branches or offers.</p> : null}
      </div>
    </div>
  );
}
