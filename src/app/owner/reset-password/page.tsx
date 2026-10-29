import { ResetForm } from "@/components/forms/auth-forms";
import { firstParam } from "@/lib/api-client";

export const metadata = { title: "Reset owner password" };

export default async function OwnerResetPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const token = firstParam((await searchParams).token) || "";
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="display text-4xl">Choose a new owner password</h1>
      <div className="mt-6">{token ? <ResetForm token={token} redirectTo="/owner/login" /> : <p>This reset link is missing a token.</p>}</div>
    </div>
  );
}
