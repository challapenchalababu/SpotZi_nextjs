"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Notice, fieldClass } from "@/components/ui/primitives";
import { api } from "@/lib/api-client";
import { REPORT_STATUSES, type ReportStatus } from "@/types/domain";

export function ReportStatusForm({ reportId, status }: { reportId: string; status: ReportStatus }) {
  const router = useRouter();
  const [nextStatus, setNextStatus] = useState<ReportStatus>(status);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <form className="space-y-3" onSubmit={async (event) => {
      event.preventDefault();
      setPending(true);
      setError(null);
      try {
        await api(`/api/admin/reports/${reportId}`, { method: "PATCH", body: JSON.stringify({ status: nextStatus, resolutionNote: note }) });
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not update the report.");
      } finally {
        setPending(false);
      }
    }}>
      {error ? <Notice tone="warning">{error}</Notice> : null}
      <Field label="Status">
        <select className={fieldClass} value={nextStatus} onChange={(event) => setNextStatus(event.target.value as ReportStatus)}>
          {REPORT_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </Field>
      <Field label="Resolution note"><textarea className={fieldClass} rows={3} value={note} onChange={(event) => setNote(event.target.value)} /></Field>
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Update report"}</Button>
    </form>
  );
}
