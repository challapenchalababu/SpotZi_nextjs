import { UserDirectory } from "@/components/dashboard/user-directory";

export const metadata = { title: "Owners" };

export default function OwnersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <UserDirectory title="Business owners" path="/super-admin/owners" role="owner" searchParams={searchParams} />;
}
