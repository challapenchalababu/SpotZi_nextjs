import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/forms/auth-forms";
import { getSession } from "@/lib/session";

export const metadata = { title: "Register a business" };

export default async function OwnerRegisterPage() {
  const session = await getSession().catch(() => null);
  if (session?.role === "owner") redirect("/owner/dashboard");
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="display text-4xl">Register your business</h1>
      <p className="mt-2 text-sm text-muted-foreground">This creates an owner account. It cannot create a super admin.</p>
      <div className="mt-6"><RegisterForm accountType="owner" /></div>
      <p className="mt-4 text-sm">Already registered? <Link className="font-semibold text-primary" href="/owner/login">Log in</Link></p>
    </div>
  );
}
