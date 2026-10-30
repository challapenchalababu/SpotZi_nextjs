import { redirect } from "next/navigation";
import { DeleteAccountCard, PasswordForm, ProfileForm } from "@/components/forms/account-forms";
import { getSession } from "@/lib/session";

export const metadata = { title: "Profile", robots: { index: false, follow: false } };

export default async function ProfilePage() {
  const session = await getSession();
  if (!session || session.role !== "customer") redirect("/login?next=/profile");
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <h1 className="display text-4xl">Profile</h1>
      <ProfileForm user={session} />
      <h2 className="text-2xl font-semibold">Password</h2>
      <PasswordForm />
      <DeleteAccountCard role={session.role} />
    </div>
  );
}
