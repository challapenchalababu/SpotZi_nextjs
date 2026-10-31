import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/forms/auth-forms";
import { Badge } from "@/components/ui/primitives";
import { formatDateTime } from "@/lib/format";
import { getAdminUser } from "@/services/admin.service";
import { listOwnerBusinesses } from "@/services/business.service";

export const metadata = { title: "User" };

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getAdminUser((await params).id);
  if (!user) notFound();
  const businesses = user.role === "owner" ? await listOwnerBusinesses(user.id) : [];
  return (
    <div className="space-y-4">
      <h1 className="display text-4xl">{user.name}</h1>
      <p>{user.email}</p>
      <p>{user.phone || "No phone number on file"}</p>
      <p className="text-sm text-muted-foreground">{user.role} · joined {formatDateTime(user.createdAt)}</p>
      <Badge tone={user.isActive ? "success" : "warning"}>{user.isActive ? "Enabled" : "Disabled"}</Badge>
      <ConfirmButton endpoint={`/api/admin/users/${user.id}`} body={{ isActive: !user.isActive }} label={user.isActive ? "Disable account" : "Enable account"} confirm="Update this account status?" />
      {businesses.length ? (
        <ul className="space-y-2">
          {businesses.map((business) => <li key={business.id}><Link href={`/super-admin/businesses/${business.id}`}>{business.businessName}</Link> · {business.branchCount ?? 0} recorded branches</li>)}
        </ul>
      ) : null}
    </div>
  );
}
