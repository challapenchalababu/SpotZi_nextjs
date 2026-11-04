"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/primitives";
import { api } from "@/lib/api-client";

export function ReviewModerationActions({
  reviewId,
  status,
}: {
  reviewId: string;
  status: "visible" | "removed";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "remove" | "restore" | "delete") {
    const confirmMessage =
      action === "delete"
        ? "Permanently delete this review from the database?"
        : action === "remove"
          ? "Hide this review from customers?"
          : "Restore this review for customers?";
    if (!window.confirm(confirmMessage)) return;
    setBusy(true);
    setError(null);
    try {
      if (action === "delete") {
        await api(`/api/admin/reviews/${reviewId}`, { method: "DELETE" });
      } else {
        await api(`/api/admin/reviews/${reviewId}`, {
          method: "PATCH",
          body: JSON.stringify({ action }),
        });
      }
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update the review.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {status === "visible" ? (
          <Button type="button" variant="secondary" disabled={busy} onClick={() => run("remove")}>
            Remove
          </Button>
        ) : (
          <Button type="button" variant="secondary" disabled={busy} onClick={() => run("restore")}>
            Restore
          </Button>
        )}
        <Button type="button" variant="danger" disabled={busy} onClick={() => run("delete")}>
          Delete permanently
        </Button>
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
