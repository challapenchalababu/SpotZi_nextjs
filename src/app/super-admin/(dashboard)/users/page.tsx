import { UserDirectory } from "@/components/dashboard/user-directory";

export const metadata = { title: "Users" };

export default function UsersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <UserDirectory title="Users" path="/super-admin/users" searchParams={searchParams} />;
}
