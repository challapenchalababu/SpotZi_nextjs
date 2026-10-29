"use client";

export default function CustomerError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="display text-4xl">This page could not be loaded</h1>
      <p className="mt-3 text-sm text-muted-foreground">{error.message || "Try again in a moment."}</p>
      <button className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" onClick={reset}>Try again</button>
    </div>
  );
}
