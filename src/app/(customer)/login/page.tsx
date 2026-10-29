import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/auth-forms";
import { firstParam } from "@/lib/api-client";
import { safeCustomerNextPath } from "@/lib/authz";
import { getSession } from "@/lib/session";

export const metadata = { title: "Log in", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getSession().catch(() => null);
  if (session?.role === "customer") redirect("/offers");
  const params = await searchParams;
  const nextPath = safeCustomerNextPath(firstParam(params.next), "/offers");
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="display text-4xl">Log in</h1>
      <p className="mt-2 text-sm text-muted-foreground">Customers use this page. Business owners and super admins have separate sign-in pages.</p>
      <div className="mt-6"><LoginForm portal="customer" nextPath={nextPath} /></div>
      <p className="mt-4 text-sm"><Link href="/register" className="font-semibold text-primary">Create an account</Link> · <Link href="/forgot-password">Forgot password</Link></p>
      <p className="mt-2 text-sm text-muted-foreground">Owners sign in at <Link className="font-semibold text-primary" href="/owner">/owner</Link>. Super admins sign in at <Link className="font-semibold text-primary" href="/super-admin">/super-admin</Link>.</p>
    </div>
  );
}
