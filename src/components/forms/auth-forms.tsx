"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { PasswordInput } from "@/components/ui/password-input";
import { Button, Dialog, Field, Notice, fieldClass } from "@/components/ui/primitives";
import { api } from "@/lib/api-client";
import { forgotSchema, loginSchema, registerSchema, resetSchema, type LoginInput, type RegisterInput } from "@/validators";

export function LoginForm({ portal, nextPath, forbidden }: { portal: LoginInput["portal"]; nextPath?: string; forbidden?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "", portal, next: nextPath } });
  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(async (values) => {
      setError(null);
      try {
        const result = await api<{ redirectTo: string }>("/api/auth/login", { method: "POST", body: JSON.stringify(values) });
        router.push(result.redirectTo);
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not sign in.");
      }
    })}>
      {forbidden ? <Notice tone="warning">That account cannot open this area.</Notice> : null}
      {error ? <Notice tone="warning">{error}</Notice> : null}
      <Field label="Email" error={form.formState.errors.email?.message}><input className={fieldClass} type="email" autoComplete="email" {...form.register("email")} /></Field>
      <PasswordInput label="Password" error={form.formState.errors.password?.message} autoComplete="current-password" {...form.register("password")} />
      <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Signing in…" : "Sign in"}</Button>
    </form>
  );
}

export function RegisterForm({ accountType }: { accountType: "customer" | "owner" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<RegisterInput>({ resolver: zodResolver(registerSchema), defaultValues: { name: "", email: "", password: "", phone: "", accountType } });
  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(async (values) => {
      setError(null);
      try {
        const result = await api<{ redirectTo: string }>("/api/auth/register", { method: "POST", body: JSON.stringify(values) });
        router.push(result.redirectTo);
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not create the account.");
      }
    })}>
      {error ? <Notice tone="warning">{error}</Notice> : null}
      <Field label="Name" error={form.formState.errors.name?.message}><input className={fieldClass} autoComplete="name" {...form.register("name")} /></Field>
      <Field label="Email" error={form.formState.errors.email?.message}><input className={fieldClass} type="email" autoComplete="email" {...form.register("email")} /></Field>
      <Field label="Phone" error={form.formState.errors.phone?.message}><input className={fieldClass} autoComplete="tel" {...form.register("phone")} /></Field>
      <PasswordInput label="Password" error={form.formState.errors.password?.message} autoComplete="new-password" {...form.register("password")} />
      <Button type="submit" disabled={form.formState.isSubmitting}>Create account</Button>
    </form>
  );
}

export function ForgotForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<{ email: string }>({ resolver: zodResolver(forgotSchema), defaultValues: { email: "" } });
  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(async (values) => {
      setError(null);
      try {
        const result = await api<{ message: string }>("/api/auth/forgot-password", { method: "POST", body: JSON.stringify(values) });
        setMessage(result.message);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not send the reset email.");
      }
    })}>
      {message ? <Notice>{message}</Notice> : null}
      {error ? <Notice tone="warning">{error}</Notice> : null}
      <Field label="Email" error={form.formState.errors.email?.message}><input className={fieldClass} type="email" {...form.register("email")} /></Field>
      <Button type="submit" disabled={form.formState.isSubmitting}>Send reset link</Button>
    </form>
  );
}

export function ResetForm({ token, redirectTo = "/login" }: { token: string; redirectTo?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<{ token: string; password: string }>({ resolver: zodResolver(resetSchema), defaultValues: { token, password: "" } });
  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(async (values) => {
      setError(null);
      try {
        await api("/api/auth/reset-password", { method: "POST", body: JSON.stringify(values) });
        router.push(`${redirectTo}?reset=1`);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not reset the password.");
      }
    })}>
      {error ? <Notice tone="warning">{error}</Notice> : null}
      <PasswordInput label="New password" error={form.formState.errors.password?.message} autoComplete="new-password" {...form.register("password")} />
      <Button type="submit" disabled={form.formState.isSubmitting}>Update password</Button>
    </form>
  );
}

export function ConfirmButton({
  endpoint,
  method = "PATCH",
  body,
  label,
  confirm,
  variant = "secondary",
  redirectTo,
}: {
  endpoint: string;
  method?: "PATCH" | "DELETE" | "POST";
  body?: object;
  label: string;
  confirm: string;
  variant?: "secondary" | "danger" | "primary";
  redirectTo?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <>
      <Button type="button" variant={variant} onClick={() => setOpen(true)}>{label}</Button>
      <Dialog open={open} title={label} onClose={() => setOpen(false)}>
        <p className="text-sm text-muted-foreground">{confirm}</p>
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="button" variant={variant === "danger" ? "danger" : "primary"} disabled={pending} onClick={async () => {
            setPending(true);
            setError(null);
            try {
              await api(endpoint, { method, body: body ? JSON.stringify(body) : undefined });
              setOpen(false);
              if (redirectTo) {
                router.push(redirectTo);
                router.refresh();
              } else {
                router.refresh();
              }
            } catch (caught) {
              setError(caught instanceof Error ? caught.message : "Could not complete that action.");
            } finally {
              setPending(false);
            }
          }}>{pending ? "Working…" : "Confirm"}</Button>
        </div>
      </Dialog>
    </>
  );
}
