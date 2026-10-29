"use client";

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="space-y-3">
      <h1 className="display text-3xl">This section could not be loaded</h1>
      <p className="text-sm text-muted-foreground">{error.message || "Check the database connection and try again."}</p>
      <button className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" onClick={reset}>Try again</button>
    </div>
  );
}
