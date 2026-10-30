import { redirect } from "next/navigation";
import { DeleteAccountForm } from "@/components/forms/account-forms";
import { getSession } from "@/lib/session";

export const metadata = { title: "Delete account", robots: { index: false, follow: false } };

export default async function DeleteAccountPage() {
  const session = await getSession();
  if (!session || session.role !== "customer") redirect("/login?next=/profile/delete-account");
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <h1 className="display text-4xl text-danger">Delete account</h1>
      <DeleteAccountForm role={session.role} />
    </div>
  );
}
