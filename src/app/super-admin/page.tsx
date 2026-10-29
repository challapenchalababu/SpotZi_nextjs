import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/components/forms/auth-forms";
import { getSession } from "@/lib/session";

export const metadata = { title: "Super admin login" };

export default async function SuperAdminIndex({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getSession().catch(() => null);
  if (session?.role === "super_admin") redirect("/super-admin/dashboard");
  const forbidden = (await searchParams).error === "forbidden";
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Link href="/" aria-label="SpotZi home" className="mb-6 inline-flex"><BrandMark priority /></Link>
      <p className="text-sm uppercase tracking-[0.16em] text-muted-foreground">Platform</p>
      <h1 className="display mt-2 text-4xl">Super admin login</h1>
      <p className="mt-2 text-sm text-muted-foreground">This account is created with the provisioning script. There is no public registration.</p>
      <div className="mt-6"><LoginForm portal="super_admin" forbidden={forbidden} /></div>
      <p className="mt-4 text-sm"><Link className="font-semibold text-primary" href="/super-admin/forgot-password">Forgot password</Link></p>
    </div>
  );
}
