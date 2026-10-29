import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/forms/auth-forms";
import { getSession } from "@/lib/session";

export const metadata = { title: "Create account", robots: { index: false, follow: false } };

export default async function RegisterPage() {
  const session = await getSession().catch(() => null);
  if (session?.role === "customer") redirect("/offers");
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="display text-4xl">Create a customer account</h1>
      <div className="mt-6"><RegisterForm accountType="customer" /></div>
      <p className="mt-4 text-sm">Already registered? <Link className="font-semibold text-primary" href="/login">Log in</Link></p>
    </div>
  );
}
