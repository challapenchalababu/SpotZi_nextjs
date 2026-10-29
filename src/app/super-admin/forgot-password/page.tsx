import { ForgotForm } from "@/components/forms/auth-forms";

export const metadata = { title: "Super admin password recovery" };

export default function AdminForgotPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="display text-4xl">Recover admin access</h1>
      <div className="mt-6"><ForgotForm /></div>
    </div>
  );
}
