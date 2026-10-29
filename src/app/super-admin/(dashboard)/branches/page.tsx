import { ConfirmButton } from "@/components/forms/auth-forms";
import { Badge, fieldClass, Pagination, pageQuery } from "@/components/ui/primitives";
import { firstParam } from "@/lib/api-client";
import { formatAddress } from "@/lib/format";
import { listAdminBranches } from "@/services/business.service";

export const metadata = { title: "All branches" };

export default async function AdminBranchesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const q = firstParam(params.q);
  const city = firstParam(params.city);
  const active = firstParam(params.isActive);
  const page = Number(firstParam(params.page) || 1);
  const result = await listAdminBranches({ page, limit: 20, q, city, isActive: active === "true" ? true : active === "false" ? false : undefined });
  return (
    <div className="space-y-4">
      <h1 className="display text-4xl">Branches</h1>
      <form className="flex flex-wrap gap-2" action="/super-admin/branches">
        <input className={fieldClass} name="q" defaultValue={q} placeholder="Branch name" aria-label="Search branches" />
        <input className={fieldClass} name="city" defaultValue={city} placeholder="City" aria-label="City" />
        <select className={fieldClass} name="isActive" defaultValue={active || ""} aria-label="Status"><option value="">Any status</option><option value="true">Enabled</option><option value="false">Disabled</option></select>
        <button className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Filter</button>
      </form>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground"><tr><th className="px-4 py-3">Branch</th><th>Business</th><th>Address</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {result.items.map((branch) => (
              <tr key={branch.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">{branch.branchName}</td>
                <td>{branch.businessName}</td>
                <td>{formatAddress(branch.address)}</td>
                <td><Badge tone={branch.isActive ? "success" : "warning"}>{branch.isActive ? "Enabled" : "Disabled"}</Badge></td>
                <td className="px-4"><ConfirmButton endpoint={`/api/admin/branches/${branch.id}`} body={{ isActive: !branch.isActive }} label={branch.isActive ? "Disable" : "Enable"} confirm="Change whether offers at this branch can appear publicly?" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={result.page} totalPages={result.totalPages} hrefFor={(next) => pageQuery("/super-admin/branches", { q, city, isActive: active }, next)} />
    </div>
  );
}
