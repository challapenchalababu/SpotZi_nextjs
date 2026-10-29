import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { isPreviewMode } from "@/lib/env";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "super_admin") redirect("/super-admin/login");
  return <DashboardShell area="super_admin" user={session} preview={isPreviewMode()}>{children}</DashboardShell>;
}
