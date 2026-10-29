import Link from "next/link";
import { cn } from "@/lib/cn";

export function buttonClass(variant: "primary" | "secondary" | "accent" | "danger" | "ghost" = "primary", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
    variant === "primary" && "border border-primary/25 bg-primary/10 text-primary hover:bg-primary/15",
    variant === "secondary" && "border border-border bg-card hover:bg-muted",
    variant === "accent" && "border border-primary/25 bg-primary/10 text-primary hover:bg-primary/15",
    variant === "danger" && "bg-danger text-white hover:bg-danger/90",
    variant === "ghost" && "hover:bg-muted",
    className,
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "accent" | "danger" | "ghost" }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}

export const fieldClass =
  "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring-2";

export function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {error ? <span className="block text-xs text-danger">{error}</span> : null}
    </label>
  );
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "accent" | "success" | "warning" | "danger" }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
        tone === "neutral" && "bg-muted text-foreground",
        tone === "accent" && "bg-accent text-white",
        tone === "success" && "bg-success/10 text-success",
        tone === "warning" && "bg-warning/10 text-warning",
        tone === "danger" && "bg-danger/10 text-danger",
      )}
    >
      {children}
    </span>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-2xl border border-border bg-card p-4 shadow-sm", className)}>{children}</div>;
}

export function Notice({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "warning" }) {
  return (
    <div className={cn("rounded-2xl border px-4 py-3 text-sm", tone === "warning" ? "border-warning/30 bg-warning/10" : "border-border bg-muted")}>
      {children}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <h2 className="display text-2xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Pagination({ page, totalPages, hrefFor }: { page: number; totalPages: number; hrefFor: (page: number) => string }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="flex items-center justify-between gap-3 text-sm" aria-label="Pagination">
      {page > 1 ? <Link className={buttonClass("secondary")} href={hrefFor(page - 1)}>Previous</Link> : <span />}
      <span>Page {page} of {totalPages}</span>
      {page < totalPages ? <Link className={buttonClass("secondary")} href={hrefFor(page + 1)}>Next</Link> : <span />}
    </nav>
  );
}

export function Dialog({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="presentation" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="dialog-title" className="w-full max-w-md rounded-2xl bg-card p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <h2 id="dialog-title" className="text-lg font-semibold">{title}</h2>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

export function pageQuery(path: string, current: Record<string, string | undefined>, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(current)) {
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
