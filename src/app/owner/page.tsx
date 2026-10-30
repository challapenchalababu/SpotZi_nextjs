import Link from "next/link";
import { redirect } from "next/navigation";
import { TrackPageView } from "@/components/analytics/site-tracker";
import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/components/forms/auth-forms";
import { getSession } from "@/lib/session";

export const metadata = { title: "Owner login" };

export default async function OwnerIndex({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getSession().catch(() => null);
  if (session?.role === "owner") redirect("/owner/dashboard");
  const forbidden = (await searchParams).error === "forbidden";
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <TrackPageView event="business_login_view" />
      <Link href="/" aria-label="SpotZi home" className="mb-6 inline-flex"><BrandMark priority /></Link>
      <p className="text-sm uppercase tracking-[0.16em] text-muted-foreground">Business owner</p>
      <h1 className="display mt-2 text-4xl">Owner login</h1>
      <p className="mt-2 text-sm text-muted-foreground">Sign in to manage your profile and today&apos;s offers. New businesses register on a separate page.</p>
      <div className="mt-6"><LoginForm portal="owner" forbidden={forbidden} /></div>
      <p className="mt-4 text-sm">
        <Link className="font-semibold text-primary" href="/owner/register">Register as an owner</Link>
        {" · "}
        <Link href="/owner/forgot-password">Forgot password</Link>
      </p>
    </div>
  );
}
