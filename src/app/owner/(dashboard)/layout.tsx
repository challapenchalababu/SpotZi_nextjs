import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { isPreviewMode } from "@/lib/env";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function OwnerDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "owner") redirect("/owner/login");
  return <DashboardShell area="owner" user={session} preview={isPreviewMode()}>{children}</DashboardShell>;
}
