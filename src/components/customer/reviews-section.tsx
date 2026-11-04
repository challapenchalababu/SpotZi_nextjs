"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Button, Field, Notice, fieldClass } from "@/components/ui/primitives";
import { api } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import type { PageResult, ReviewDTO, ReviewSummary, ReviewTargetType } from "@/types/domain";

function Stars({
  value,
  onChange,
  readOnly = false,
}: {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="flex items-center gap-1" role={readOnly ? "img" : "group"} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          className={readOnly ? "cursor-default" : "rounded p-0.5 hover:scale-105"}
          onClick={() => onChange?.(star)}
          aria-label={`${star} star${star === 1 ? "" : "s"}`}
        >
          <Star className={`size-5 ${star <= value ? "fill-accent text-accent" : "text-border"}`} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

type ReviewsPayload = PageResult<ReviewDTO> & { summary: ReviewSummary; mine?: ReviewDTO | null };

export function ReviewsSection({
  targetType,
  targetId,
  loginNext,
  canWrite,
}: {
  targetType: ReviewTargetType;
  targetId: string;
  loginNext: string;
  canWrite: boolean;
}) {
  const [data, setData] = useState<ReviewsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  async function load() {
    setError(null);
    try {
      const result = await api<ReviewsPayload>(`/api/reviews?targetType=${targetType}&targetId=${encodeURIComponent(targetId)}&limit=20`);
      setData(result);
      if (result.mine) {
        setRating(result.mine.rating);
        setComment(result.mine.comment);
        setEditing(false);
      } else {
        setRating(5);
        setComment("");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load reviews.");
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when target changes
  }, [targetType, targetId]);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      await api("/api/reviews", {
        method: "POST",
        body: JSON.stringify({ targetType, targetId, rating, comment }),
      });
      await load();
      setEditing(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save your review.");
    } finally {
      setSaving(false);
    }
  }

  async function removeMine() {
    if (!data?.mine) return;
    if (!window.confirm("Remove your review?")) return;
    setSaving(true);
    setError(null);
    try {
      await api(`/api/reviews/${data.mine.id}`, { method: "DELETE" });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not remove your review.");
    } finally {
      setSaving(false);
    }
  }

  const summary = data?.summary || { averageRating: 0, reviewCount: 0 };
  const label = targetType === "offer" ? "offer" : "store";

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="display text-3xl">Ratings & reviews</h2>
          <p className="mt-1 text-sm text-muted-foreground">Share how this {label} worked for you.</p>
        </div>
        <div className="text-sm">
          {summary.reviewCount ? (
            <p className="flex items-center gap-2 font-medium">
              <Stars value={Math.round(summary.averageRating)} readOnly />
              {summary.averageRating.toFixed(1)} · {summary.reviewCount} review{summary.reviewCount === 1 ? "" : "s"}
            </p>
          ) : (
            <p className="text-muted-foreground">No reviews yet</p>
          )}
        </div>
      </div>

      {error ? <Notice tone="warning">{error}</Notice> : null}

      {canWrite ? (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
          {data?.mine && !editing ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Your review</p>
              <Stars value={data.mine.rating} readOnly />
              <p className="text-sm whitespace-pre-wrap">{data.mine.comment}</p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={() => setEditing(true)}>
                  Edit
                </Button>
                <Button type="button" variant="ghost" disabled={saving} onClick={removeMine}>
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                void submit();
              }}
            >
              <p className="text-sm font-medium">{data?.mine ? "Update your review" : `Rate this ${label}`}</p>
              <Stars value={rating} onChange={setRating} />
              <Field label="Your review">
                <textarea
                  className={fieldClass}
                  rows={4}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="What should other customers know?"
                  required
                  minLength={10}
                  maxLength={1000}
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : data?.mine ? "Save changes" : "Submit review"}
                </Button>
                {data?.mine && editing ? (
                  <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                ) : null}
              </div>
            </form>
          )}
        </div>
      ) : (
        <Notice>
          <Link className="font-semibold text-primary" href={`/login?next=${encodeURIComponent(loginNext)}`}>
            Log in
          </Link>{" "}
          or{" "}
          <Link className="font-semibold text-primary" href={`/register?next=${encodeURIComponent(loginNext)}`}>
            register
          </Link>{" "}
          as a customer to leave a rating and review.
        </Notice>
      )}

      <ul className="space-y-3">
        {(data?.items || []).filter((item) => !item.mine).map((review) => (
          <li key={review.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">{review.userName || "Customer"}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(review.createdAt)}</p>
            </div>
            <div className="mt-2">
              <Stars value={review.rating} readOnly />
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm">{review.comment}</p>
          </li>
        ))}
        {data && data.items.filter((item) => !item.mine).length === 0 && !data.mine ? (
          <li className="text-sm text-muted-foreground">Be the first to review this {label}.</li>
        ) : null}
      </ul>
    </section>
  );
}
