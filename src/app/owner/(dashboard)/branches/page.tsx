import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/primitives";
import { formatAddress } from "@/lib/format";
import { getSession } from "@/lib/session";
import { listBranchesForOwner } from "@/services/business.service";

export const metadata = { title: "Branches" };

export default async function OwnerBranchesPage() {
  const session = await getSession();
  if (!session) redirect("/owner/login");
  const branches = await listBranchesForOwner(session.id);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="display text-4xl">Branches</h1>
        <Link className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" href="/owner/branches/create">Add branch</Link>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground"><tr><th className="px-4 py-3">Branch</th><th>Business</th><th>Address</th><th>Status</th></tr></thead>
          <tbody>
            {branches.map((branch) => (
              <tr key={branch.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3"><Link href={`/owner/branches/${branch.id}/edit`}>{branch.branchName}</Link></td>
                <td>{branch.businessName}</td>
                <td>{formatAddress(branch.address)}</td>
                <td><Badge tone={branch.isActive ? "success" : "warning"}>{branch.isActive ? "Active" : "Disabled"}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
        {branches.length === 0 ? <p className="px-4 py-6 text-sm text-muted-foreground">Add a branch with coordinates so nearby search can find its offers.</p> : null}
      </div>
    </div>
  );
}
