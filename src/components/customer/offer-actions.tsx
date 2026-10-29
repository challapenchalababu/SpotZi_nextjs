"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { Button, Dialog, Field, Notice, fieldClass } from "@/components/ui/primitives";
import { api } from "@/lib/api-client";
import { reportSchema } from "@/validators";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { ReportReason } from "@/types/domain";

export function FavoriteButton({ offerId, initial }: { offerId: string; initial: boolean }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <Button type="button" variant={saved ? "primary" : "secondary"} onClick={async () => {
        setError(null);
        try {
          if (saved) {
            await api(`/api/favorites/${offerId}`, { method: "DELETE" });
            setSaved(false);
          } else {
            await api(`/api/favorites/${offerId}`, { method: "POST" });
            setSaved(true);
          }
          router.refresh();
        } catch (caught) {
          const message = caught instanceof Error ? caught.message : "Sign in as a customer to save offers.";
          setError(message);
          if (message.toLowerCase().includes("sign in")) router.push(`/login?next=/offers`);
        }
      }}>
        <Heart className="size-4" aria-hidden="true" />
        {saved ? "Saved" : "Save offer"}
      </Button>
      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
    </div>
  );
}

export function ClaimButton({ offerId, enabled, initialCode = null, initialStatus = null }: { offerId: string; enabled: boolean; initialCode?: string | null; initialStatus?: "claimed" | "redeemed" | null }) {
  const [code, setCode] = useState<string | null>(initialCode);
  const [status, setStatus] = useState<"claimed" | "redeemed" | null>(initialCode ? initialStatus : null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  if (!enabled && !code) return <p className="text-sm text-muted-foreground">Claims are available while this offer is open.</p>;
  return (
    <div className="space-y-2">
      {code ? null : (
        <Button type="button" disabled={pending} onClick={async () => {
          setPending(true);
          setError(null);
          try {
            const result = await api<{ redemptionCode: string }>("/api/redemptions", { method: "POST", body: JSON.stringify({ offerId }) });
            setCode(result.redemptionCode);
            setStatus("claimed");
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Could not claim this offer.");
          } finally {
            setPending(false);
          }
        }}>{pending ? "Claiming…" : "Claim offer"}</Button>
      )}
      {code ? (
        <Notice tone={status === "redeemed" ? "warning" : "info"}>
          Your code is <strong className="font-mono">{code}</strong>. {status === "redeemed" ? "The shop has already marked this code as used." : "It is unique to you. Show it at the shop so they can confirm it is yours."}
        </Notice>
      ) : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}

export function ReportButton({ offerId }: { offerId: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const form = useForm<{ offerId: string; reason: ReportReason; description: string }>({
    resolver: zodResolver(reportSchema),
    defaultValues: { offerId, reason: "misleading", description: "" },
  });
  return (
    <>
      <Button type="button" variant="ghost" onClick={() => setOpen(true)}>Report offer</Button>
      <Dialog open={open} title="Report this offer" onClose={() => setOpen(false)}>
        <form className="space-y-3" onSubmit={form.handleSubmit(async (values) => {
          setMessage(null);
          try {
            await api("/api/reports", { method: "POST", body: JSON.stringify(values) });
            setMessage("Report submitted.");
            setOpen(false);
          } catch (caught) {
            setMessage(caught instanceof Error ? caught.message : "Could not submit the report.");
          }
        })}>
          <Field label="Reason" error={form.formState.errors.reason?.message}>
            <select className={fieldClass} {...form.register("reason")}>
              <option value="misleading">Misleading</option>
              <option value="expired">Expired</option>
              <option value="inappropriate">Inappropriate</option>
              <option value="spam">Spam</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Details" error={form.formState.errors.description?.message}>
            <textarea className={fieldClass} rows={4} {...form.register("description")} />
          </Field>
          {message ? <p className="text-sm">{message}</p> : null}
          <Button type="submit" disabled={form.formState.isSubmitting}>Submit report</Button>
        </form>
      </Dialog>
    </>
  );
}
