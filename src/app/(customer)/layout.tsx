import { SiteFooter } from "@/components/customer/site-footer";
import { SiteHeader } from "@/components/customer/site-header";
import { PreviewBanner } from "@/components/seo";
import { getSession } from "@/lib/session";
import { getPlatformSettings } from "@/services/catalog.service";

export const dynamic = "force-dynamic";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const [session, supportEmail] = await Promise.all([
    getSession().catch(() => null),
    getPlatformSettings().then((settings) => settings.supportEmail).catch(() => ""),
  ]);
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader user={session} />
      <PreviewBanner />
      <main id="content" className="flex-1">{children}</main>
      <SiteFooter supportEmail={supportEmail} />
    </div>
  );
}
