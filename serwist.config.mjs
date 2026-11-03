// @ts-check
import { serwist } from "@serwist/next/config";

export default await serwist({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Keep private/dynamic owner pages out of the automatic HTML precache set.
  precachePrerendered: false,
  additionalPrecacheEntries: [
    { url: "/~offline", revision: "spotzi-offline-v1" },
    { url: "/icons/icon-192.png", revision: "spotzi-icon-192" },
    { url: "/icons/icon-512.png", revision: "spotzi-icon-512" },
    { url: "/manifest.webmanifest", revision: "spotzi-manifest-v1" },
  ],
});
