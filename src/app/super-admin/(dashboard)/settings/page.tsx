import { SettingsForm } from "@/components/forms/account-forms";
import { getPlatformSettings } from "@/services/catalog.service";

export const metadata = { title: "Platform settings" };

export default async function AdminSettingsPage() {
  const settings = await getPlatformSettings();
  return (
    <div className="space-y-4">
      <h1 className="display text-4xl">Settings</h1>
      <SettingsForm settings={settings} />
      <p className="max-w-xl text-sm text-muted-foreground">Google Search Console verification uses the GOOGLE_SITE_VERIFICATION environment variable. Cloudinary and SMTP credentials are read from the server environment and are not shown here.</p>
    </div>
  );
}
