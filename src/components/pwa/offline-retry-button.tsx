"use client";

export function OfflineRetryButton() {
  return (
    <button
      type="button"
      className="rounded-full bg-[#103B3A] px-4 py-2 text-sm font-semibold text-[#F5FAF7]"
      onClick={() => {
        if (typeof window !== "undefined") window.location.reload();
      }}
    >
      Retry connection
    </button>
  );
}
