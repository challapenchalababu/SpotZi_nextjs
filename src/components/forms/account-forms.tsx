"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { PasswordInput } from "@/components/ui/password-input";
import { Button, Field, Notice, fieldClass } from "@/components/ui/primitives";
import { api } from "@/lib/api-client";
import { changePasswordSchema, profileSchema, settingsSchema } from "@/validators";
import type { PlatformSettingsDTO, SessionUser } from "@/types/domain";

export function ProfileForm({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const form = useForm({ resolver: zodResolver(profileSchema), defaultValues: { name: user.name, phone: user.phone ?? "" } });
  return (
    <form className="max-w-lg space-y-4" onSubmit={form.handleSubmit(async (values) => {
      setMessage(null);
      try {
        await api("/api/auth/me", { method: "PATCH", body: JSON.stringify(values) });
        setMessage("Profile saved.");
        router.refresh();
      } catch (caught) {
        setMessage(caught instanceof Error ? caught.message : "Could not save your profile.");
      }
    })}>
      {message ? <Notice>{message}</Notice> : null}
      <Field label="Name" error={form.formState.errors.name?.message}><input className={fieldClass} {...form.register("name")} /></Field>
      <Field label="Phone"><input className={fieldClass} {...form.register("phone")} /></Field>
      <p className="text-sm text-muted-foreground">Email: {user.email}</p>
      <Button type="submit">Save profile</Button>
    </form>
  );
}

export function PasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const form = useForm({ resolver: zodResolver(changePasswordSchema), defaultValues: { currentPassword: "", newPassword: "" } });
  return (
    <form className="max-w-lg space-y-4" onSubmit={form.handleSubmit(async (values) => {
      setMessage(null);
      try {
        await api("/api/auth/change-password", { method: "POST", body: JSON.stringify(values) });
        setMessage("Password updated.");
        form.reset();
      } catch (caught) {
        setMessage(caught instanceof Error ? caught.message : "Could not change the password.");
      }
    })}>
      {message ? <Notice>{message}</Notice> : null}
      <PasswordInput label="Current password" error={form.formState.errors.currentPassword?.message} autoComplete="current-password" {...form.register("currentPassword")} />
      <PasswordInput label="New password" error={form.formState.errors.newPassword?.message} autoComplete="new-password" {...form.register("newPassword")} />
      <Button type="submit">Change password</Button>
    </form>
  );
}

export function SettingsForm({ settings }: { settings: PlatformSettingsDTO }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const form = useForm({ resolver: zodResolver(settingsSchema), defaultValues: { supportEmail: settings.supportEmail, defaultRadiusKm: settings.defaultRadiusKm } });
  return (
    <form className="max-w-lg space-y-4" onSubmit={form.handleSubmit(async (values) => {
      setMessage(null);
      try {
        await api("/api/admin/settings", { method: "PATCH", body: JSON.stringify(values) });
        setMessage("Settings saved.");
        router.refresh();
      } catch (caught) {
        setMessage(caught instanceof Error ? caught.message : "Could not save settings.");
      }
    })}>
      {message ? <Notice>{message}</Notice> : null}
      <Field label="Support email" error={form.formState.errors.supportEmail?.message}><input className={fieldClass} type="email" {...form.register("supportEmail")} /></Field>
      <Field label="Default search radius (km)" error={form.formState.errors.defaultRadiusKm?.message}><input className={fieldClass} type="number" {...form.register("defaultRadiusKm", { valueAsNumber: true })} /></Field>
      <p className="text-sm text-muted-foreground">Maximum radius is {settings.maxRadiusKm} km from the server configuration. Image storage: {settings.imageStorage}. Email delivery: {settings.emailDelivery}.</p>
      <Button type="submit">Save settings</Button>
    </form>
  );
}
