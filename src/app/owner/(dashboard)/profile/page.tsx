import { redirect } from "next/navigation";
import { DeleteAccountCard, PasswordForm, ProfileForm } from "@/components/forms/account-forms";
import { getSession } from "@/lib/session";

export const metadata = { title: "Owner profile" };

export default async function OwnerProfilePage() {
  const session = await getSession();
  if (!session) redirect("/owner/login");
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
