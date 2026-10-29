import { ForgotForm } from "@/components/forms/auth-forms";

export const metadata = { title: "Owner password recovery" };

export default function OwnerForgotPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="display text-4xl">Recover owner access</h1>
      <div className="mt-6"><ForgotForm /></div>
    </div>
  );
}
