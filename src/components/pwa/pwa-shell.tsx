"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, WifiOff, X } from "lucide-react";
import { useSerwist } from "@/components/pwa/serwist-provider";
import { Dialog } from "@/components/ui/primitives";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandaloneDisplay() {
  if (typeof window === "undefined") return true;
  const media = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone = "standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return media || iosStandalone;
}

function isIosSafari() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const webkit = /WebKit/.test(ua);
  const chromeIos = /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return iOS && webkit && !chromeIos;
}

function formBusy() {
  if (typeof document === "undefined") return false;
  const active = document.activeElement;
  if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement) {
    return true;
  }
  return Boolean(document.querySelector("form[data-submitting='true'], button[type='submit'][disabled], [aria-busy='true']"));
}

export function PwaShell() {
  const { serwist } = useSerwist();
  const [online, setOnline] = useState(true);
  const [installed, setInstalled] = useState(true);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(false);
  const ios = useMemo(() => isIosSafari(), []);

  useEffect(() => {
    setOnline(window.navigator.onLine);
    setInstalled(isStandaloneDisplay());
    setInstallDismissed(window.sessionStorage.getItem("spotzi-install-dismissed") === "1");

    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setInstalled(false);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!serwist) return;
    const onWaiting = () => setUpdateReady(true);
    serwist.addEventListener("waiting", onWaiting);
    return () => {
      serwist.removeEventListener("waiting", onWaiting);
    };
  }, [serwist]);

  async function installApp() {
    if (installEvent) {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
        setInstallEvent(null);
      }
      return;
    }
    if (ios) setShowIosHelp(true);
  }

  function dismissInstall() {
    setInstallDismissed(true);
    window.sessionStorage.setItem("spotzi-install-dismissed", "1");
  }

  function applyUpdate() {
    if (formBusy()) {
      window.alert("Finish the current form first, then tap Update Now.");
      return;
    }
    serwist?.addEventListener("controlling", () => {
      window.location.reload();
    });
    serwist?.messageSkipWaiting();
  }

  const showInstall = !installed && !installDismissed && (Boolean(installEvent) || ios);

  return (
    <>
      {!online ? (
        <div className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 bg-[#103B3A] px-3 py-2 text-xs font-medium text-[#F5FAF7]" role="status">
          <WifiOff className="size-3.5" aria-hidden="true" />
          You are offline. Showing saved public pages when available.
        </div>
      ) : null}

      {updateReady ? (
        <div className="fixed inset-x-0 bottom-20 z-[60] mx-auto flex w-[min(36rem,calc(100%-1.5rem))] items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-lg sm:bottom-6">
          <p>A new SpotZi version is ready.</p>
          <button type="button" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground" onClick={applyUpdate}>
            <RefreshCw className="size-3.5" aria-hidden="true" />
            Update Now
          </button>
        </div>
      ) : null}

      {showInstall ? (
        <div className="fixed inset-x-0 bottom-4 z-[55] mx-auto flex w-[min(36rem,calc(100%-1.5rem))] items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-lg">
          <div>
            <p className="font-semibold">Install SpotZi</p>
            <p className="text-xs text-muted-foreground">Add to your home screen for faster nearby offers.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="rounded-full px-2 py-1 text-muted-foreground hover:bg-muted" aria-label="Dismiss install prompt" onClick={dismissInstall}>
              <X className="size-4" />
            </button>
            <button type="button" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground" onClick={installApp}>
              <Download className="size-3.5" aria-hidden="true" />
              Install
            </button>
          </div>
        </div>
      ) : null}

      <Dialog open={showIosHelp} title="Add SpotZi to Home Screen" onClose={() => setShowIosHelp(false)}>
        <ol className="list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
          <li>Tap the Share button in Safari.</li>
          <li>Scroll and choose Add to Home Screen.</li>
          <li>Confirm Add to install SpotZi.</li>
        </ol>
        <button type="button" className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" onClick={() => setShowIosHelp(false)}>
          Got it
        </button>
      </Dialog>
    </>
  );
}

export function InstallAppButton({ className }: { className?: string }) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [installed, setInstalled] = useState(true);

  useEffect(() => {
    setInstalled(isStandaloneDisplay());
    setIos(isIosSafari());
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || (!installEvent && !ios)) return null;

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={async () => {
          if (installEvent) {
            await installEvent.prompt();
            return;
          }
          if (ios) setHelpOpen(true);
        }}
      >
        Install app
      </button>
      <Dialog open={helpOpen} title="Add SpotZi to Home Screen" onClose={() => setHelpOpen(false)}>
        <ol className="list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
          <li>Tap the Share button in Safari.</li>
          <li>Choose Add to Home Screen.</li>
          <li>Confirm Add.</li>
        </ol>
      </Dialog>
    </>
  );
}
