import { redirect } from "next/navigation";
import { BranchForm } from "@/components/forms/branch-form";
import { getSession } from "@/lib/session";
import { listOwnerBusinesses } from "@/services/business.service";

export const metadata = { title: "Add branch" };

export default async function CreateBranchPage() {
  const session = await getSession();
  if (!session) redirect("/owner/login");
  const businesses = await listOwnerBusinesses(session.id);
  return (
    <div className="space-y-4">
      <h1 className="display text-4xl">Add a branch</h1>
      <BranchForm businesses={businesses} />
    </div>
  );
}
