import { SPOTZI_LOADER_URL } from "@/lib/loader-asset";

export function SpotZiLoaderOverlay() {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#103B3A]/45 backdrop-blur-[1px]" role="status" aria-live="polite" aria-busy="true">
      <img
        src={SPOTZI_LOADER_URL}
        alt="Loading SpotZi"
        width={400}
        height={225}
        className="h-64 w-auto max-w-[min(94vw,40rem)] bg-transparent object-contain sm:h-72 md:h-80"
        decoding="async"
      />
      <span className="sr-only">Loading</span>
    </div>
  );
}
