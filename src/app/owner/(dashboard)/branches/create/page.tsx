import { redirect } from "next/navigation";
import { BranchForm } from "@/components/forms/branch-form";
import { firstParam } from "@/lib/api-client";
import { getSession } from "@/lib/session";
import { listOwnerBusinesses } from "@/services/business.service";

export const metadata = { title: "Add branch" };

export default async function CreateBranchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect("/owner/login");
  const businessId = firstParam((await searchParams).businessId);
  const businesses = await listOwnerBusinesses(session.id);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="display text-4xl">Add a branch</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add the shop location next. After this, you can create today&apos;s offer.
        </p>
      </div>
      <BranchForm businesses={businesses} defaultBusinessId={businessId || undefined} />
    </div>
  );
}
