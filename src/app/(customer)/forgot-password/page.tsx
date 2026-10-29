import { ForgotForm } from "@/components/forms/auth-forms";

export const metadata = { title: "Forgot password", robots: { index: false, follow: false } };

export default function ForgotPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="display text-4xl">Reset your password</h1>
      <p className="mt-2 text-sm text-muted-foreground">If email delivery is not configured, a development server prints the reset link in its console. The response never reveals whether the email exists.</p>
      <div className="mt-6"><ForgotForm /></div>
    </div>
  );
}
