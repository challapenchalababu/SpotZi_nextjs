import { redirect } from "next/navigation";
import { DeleteAccountForm } from "@/components/forms/account-forms";
import { getSession } from "@/lib/session";

export const metadata = { title: "Delete account" };

export default async function AdminDeleteAccountPage() {
  const session = await getSession();
  if (!session) redirect("/super-admin/login");
  return (
    <div className="space-y-6">
      <h1 className="display text-4xl text-danger">Delete account</h1>
      <DeleteAccountForm role={session.role} />
    </div>
  );
}
