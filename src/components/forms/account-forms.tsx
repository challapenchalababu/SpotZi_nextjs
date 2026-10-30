"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { PasswordInput } from "@/components/ui/password-input";
import { Button, Field, Notice, buttonClass, fieldClass } from "@/components/ui/primitives";
import { api } from "@/lib/api-client";
import { changePasswordSchema, deleteAccountSchema, profileSchema, settingsSchema } from "@/validators";
import type { PlatformSettingsDTO, SessionUser } from "@/types/domain";

function deleteAccountHref(role: SessionUser["role"]) {
  if (role === "owner") return "/owner/profile/delete-account";
  if (role === "super_admin") return "/super-admin/profile/delete-account";
  return "/profile/delete-account";
}

function profileHref(role: SessionUser["role"]) {
  if (role === "owner") return "/owner/profile";
  if (role === "super_admin") return "/super-admin/profile";
  return "/profile";
}

function loginHref(role: SessionUser["role"]) {
  if (role === "owner") return "/owner/login";
  if (role === "super_admin") return "/super-admin/login";
  return "/login";
}

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

export function DeleteAccountCard({ role }: { role: SessionUser["role"] }) {
  const ownerWarning =
    role === "owner"
      ? " This also permanently removes your businesses, branches, and offers."
      : "";

  return (
    <div className="max-w-lg space-y-3 rounded-2xl border border-danger/25 bg-danger/5 p-4">
      <h2 className="text-lg font-semibold text-danger">Delete account</h2>
      <p className="text-sm text-muted-foreground">
        Permanently delete your SpotZi account and sign-out sessions.{ownerWarning} This cannot be undone.
      </p>
      <Link className={buttonClass("danger")} href={deleteAccountHref(role)}>
        Delete account
      </Link>
    </div>
  );
}

export function DeleteAccountForm({ role }: { role: SessionUser["role"] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { password: "", confirmation: "" },
  });

  const ownerWarning =
    role === "owner"
      ? " This also permanently removes your businesses, branches, and offers."
      : "";

  return (
    <form
      className="max-w-lg space-y-4 rounded-2xl border border-danger/25 bg-danger/5 p-4"
      onSubmit={form.handleSubmit(async (values) => {
        setError(null);
        try {
          await api("/api/auth/delete-account", { method: "POST", body: JSON.stringify(values) });
          router.push(loginHref(role));
          router.refresh();
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Could not delete the account.");
        }
      })}
    >
      <p className="text-sm text-muted-foreground">
        Permanently delete your SpotZi account and sign-out sessions.{ownerWarning} Enter your password and type{" "}
        <span className="font-semibold text-foreground">DELETE</span> to confirm. This cannot be undone.
      </p>
      {error ? <Notice tone="warning">{error}</Notice> : null}
      <PasswordInput
        label="Password"
        error={form.formState.errors.password?.message}
        autoComplete="current-password"
        {...form.register("password")}
      />
      <Field label="Type DELETE to confirm" error={form.formState.errors.confirmation?.message}>
        <input className={fieldClass} autoComplete="off" placeholder="DELETE" {...form.register("confirmation")} />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Link className={buttonClass("ghost")} href={profileHref(role)}>
          Cancel
        </Link>
        <Button type="submit" variant="danger" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Deleting…" : "Delete my account"}
        </Button>
      </div>
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
