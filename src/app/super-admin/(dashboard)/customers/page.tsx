import { UserDirectory } from "@/components/dashboard/user-directory";

export const metadata = { title: "Customers" };

export default function CustomersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <UserDirectory title="Customers" path="/super-admin/customers" role="customer" searchParams={searchParams} />;
}
