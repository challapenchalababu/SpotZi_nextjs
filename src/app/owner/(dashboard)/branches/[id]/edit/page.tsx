import { notFound } from "next/navigation";
import { BranchForm } from "@/components/forms/branch-form";
import { getSession } from "@/lib/session";
import { getBranchForOwner, listOwnerBusinesses } from "@/services/business.service";

export const metadata = { title: "Edit branch" };

export default async function EditBranchPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) notFound();
  const { id } = await params;
  const [branch, businesses] = await Promise.all([
    getBranchForOwner(session.id, id).catch(() => null),
    listOwnerBusinesses(session.id),
  ]);
  if (!branch) notFound();
  return (
    <div className="space-y-4">
      <h1 className="display text-4xl">Edit {branch.branchName}</h1>
      <BranchForm businesses={businesses} branch={branch} />
    </div>
  );
}
