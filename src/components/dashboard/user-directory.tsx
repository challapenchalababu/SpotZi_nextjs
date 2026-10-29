import Link from "next/link";
import { ConfirmButton } from "@/components/forms/auth-forms";
import { Badge, fieldClass, Pagination, pageQuery } from "@/components/ui/primitives";
import { firstParam } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import { listUsers } from "@/services/admin.service";
import type { UserRole } from "@/types/domain";

export async function UserDirectory({
  title,
  path,
  role,
  searchParams,
}: {
  title: string;
  path: string;
  role?: Extract<UserRole, "customer" | "owner">;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = firstParam(params.q);
  const active = firstParam(params.isActive);
  const page = Number(firstParam(params.page) || 1);
  const users = await listUsers({
    page,
    limit: 20,
    q,
    role,
    isActive: active === "true" ? true : active === "false" ? false : undefined,
  });
  return (
    <div className="space-y-4">
      <h1 className="display text-4xl">{title}</h1>
      <form className="flex flex-wrap gap-2" action={path}>
        <input className={fieldClass} name="q" defaultValue={q} placeholder="Name or email" aria-label="Search users" />
        <select className={fieldClass} name="isActive" defaultValue={active || ""} aria-label="Account status">
          <option value="">Any status</option>
          <option value="true">Enabled</option>
          <option value="false">Disabled</option>
        </select>
        <button className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Filter</button>
      </form>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground"><tr><th className="px-4 py-3">Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {users.items.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3"><Link href={`/super-admin/users/${user.id}`}>{user.name}</Link></td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{formatDateTime(user.createdAt)}</td>
                <td><Badge tone={user.isActive ? "success" : "warning"}>{user.isActive ? "Enabled" : "Disabled"}</Badge></td>
                <td className="px-4 py-3"><ConfirmButton endpoint={`/api/admin/users/${user.id}`} body={{ isActive: !user.isActive }} label={user.isActive ? "Disable" : "Enable"} confirm={user.isActive ? "Disable this account? Existing sessions stop working on the next request." : "Enable this account?"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={users.page} totalPages={users.totalPages} hrefFor={(next) => pageQuery(path, { q, isActive: active }, next)} />
    </div>
  );
}
