"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Notice, fieldClass } from "@/components/ui/primitives";
import { api } from "@/lib/api-client";
import type { RedemptionCheck } from "@/types/domain";

export function VerifyRedemption() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<RedemptionCheck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [working, setWorking] = useState(false);

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setResult(null);
    try {
      setResult(await api<RedemptionCheck>("/api/redemptions/verify", { method: "POST", body: JSON.stringify({ code }) }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not check that code.");
    } finally {
      setPending(false);
    }
  }

  async function markRedeemed() {
    if (!result?.redemption) return;
    setWorking(true);
    setError(null);
    try {
      await api(`/api/redemptions/${result.redemption.id}`, { method: "PATCH", body: JSON.stringify({ status: "redeemed" }) });
      setResult({
        valid: false,
        reason: "redeemed",
        message: `Marked as used for ${result.redemption.customerName || "this customer"}.`,
        redemption: { ...result.redemption, status: "redeemed" },
      });
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not mark this code as used.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <form className="space-y-3 rounded-2xl border border-border bg-card p-4" onSubmit={verify}>
      <div>
        <h2 className="text-xl font-semibold">Check a customer code</h2>
        <p className="mt-1 text-sm text-muted-foreground">Enter the code the customer shows you. A valid code names that customer and the offer it belongs to.</p>
      </div>
      <label className="block text-sm">
        Redemption code
        <input className={`${fieldClass} mt-1 font-mono uppercase`} value={code} onChange={(event) => setCode(event.target.value)} autoComplete="off" spellCheck={false} placeholder="Customer code" />
      </label>
      <Button type="submit" disabled={pending || code.trim().length < 4}>{pending ? "Checking…" : "Check code"}</Button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {result ? (
        <Notice tone={result.valid ? "info" : "warning"}>
          <p className="font-semibold">{result.valid ? "Valid for this customer" : "Not valid to use"}</p>
          <p className="mt-1">{result.message}</p>
          {result.redemption ? (
            <p className="mt-2 font-mono">
              {result.redemption.redemptionCode} · {result.redemption.customerName || "Customer"} · {result.redemption.offerTitle} · {result.redemption.branchName}
            </p>
          ) : null}
        </Notice>
      ) : null}
      {result?.valid && result.redemption ? (
        <Button type="button" disabled={working} onClick={markRedeemed}>{working ? "Saving…" : "Mark as used"}</Button>
      ) : null}
    </form>
  );
}
