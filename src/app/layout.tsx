import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { AppLoader } from "@/components/ui/app-loader";
import { APP_NAME, getAppUrl } from "@/lib/env";
import { SPOTZI_LOADER_URL } from "@/lib/loader-asset";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });

export const metadata: Metadata = {
  metadataBase: new URL(getAppUrl()),
  title: { default: `${APP_NAME} — Nearby Deals. Happier You.`, template: `%s · ${APP_NAME}` },
  description: "SpotZi helps you find daily offers and promotional posters from restaurants, cafes, shops, salons, and supermarkets near you.",
  applicationName: APP_NAME,
  robots: { index: true, follow: true },
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: `${APP_NAME} — Nearby Deals. Happier You.`,
    description: "Find today's local promotions from businesses around you.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable} h-full`}>
      <head>
        <link rel="preload" href={SPOTZI_LOADER_URL} as="image" type="image/gif" />
      </head>
      <body className="min-h-full bg-background text-foreground antialiased">
        <svg aria-hidden="true" className="absolute h-0 w-0" focusable="false">
          <defs>
            <linearGradient id="spotzi-icon" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1f9a45" />
              <stop offset="50%" stopColor="#14784a" />
              <stop offset="100%" stopColor="#0e2c33" />
            </linearGradient>
          </defs>
        </svg>
        {children}
        <AppLoader />
      </body>
    </html>
  );
}
