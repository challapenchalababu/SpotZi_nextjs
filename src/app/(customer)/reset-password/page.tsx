import { ResetForm } from "@/components/forms/auth-forms";
import { firstParam } from "@/lib/api-client";

export const metadata = { title: "Choose a new password", robots: { index: false, follow: false } };

export default async function ResetPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const token = firstParam((await searchParams).token) || "";
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="display text-4xl">Choose a new password</h1>
      <div className="mt-6">{token ? <ResetForm token={token} /> : <p>This reset link is missing a token.</p>}</div>
    </div>
  );
}
