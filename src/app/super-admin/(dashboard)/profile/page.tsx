import { redirect } from "next/navigation";
import { DeleteAccountCard, PasswordForm, ProfileForm } from "@/components/forms/account-forms";
import { getSession } from "@/lib/session";

export const metadata = { title: "Admin profile" };

export default async function AdminProfilePage() {
  const session = await getSession();
  if (!session) redirect("/super-admin/login");
  return (
    <div className="space-y-8">
      <h1 className="display text-4xl">Profile</h1>
      <ProfileForm user={session} />
      <h2 className="text-2xl font-semibold">Password</h2>
      <PasswordForm />
      <DeleteAccountCard role={session.role} />
    </div>
  );
}
