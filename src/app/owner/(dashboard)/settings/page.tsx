import { PasswordForm } from "@/components/forms/account-forms";

export const metadata = { title: "Owner settings" };

export default function OwnerSettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="display text-4xl">Settings</h1>
      <p className="text-sm text-muted-foreground">Changing your password signs out other sessions for this account.</p>
      <PasswordForm />
    </div>
  );
}
