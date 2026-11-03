import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { OfflineRetryButton } from "@/components/pwa/offline-retry-button";

export const metadata = {
  title: "Offline",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F5FAF7] px-4 py-16 text-center text-[#103B3A]">
      <BrandMark />
      <h1 className="display mt-8 text-4xl">You are offline</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-[#103B3A]/80">
        SpotZi could not reach the network. Previously opened public pages may still be available from this device. Private dashboards and live offer updates need a connection.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <OfflineRetryButton />
        <Link href="/" className="rounded-full border border-[#103B3A]/20 px-4 py-2 text-sm font-semibold">
          Go home
        </Link>
        <Link href="/offers" className="rounded-full border border-[#103B3A]/20 px-4 py-2 text-sm font-semibold">
          Browse offers
        </Link>
      </div>
    </main>
  );
}
