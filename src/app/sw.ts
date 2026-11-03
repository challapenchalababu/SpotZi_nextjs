/// <reference lib="esnext" />
/// <reference lib="webworker" />
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  Serwist,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const HOUR = 60 * 60;
const DAY = 24 * HOUR;

function isPrivatePath(pathname: string) {
  if (
    pathname.startsWith("/owner") ||
    pathname.startsWith("/super-admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/favorites") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/uploads") ||
    pathname.startsWith("/api/owner") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/redemptions") ||
    pathname.startsWith("/api/favorites") ||
    pathname.startsWith("/api/reports") ||
    pathname.startsWith("/api/businesses") ||
    pathname.startsWith("/api/branches") ||
    pathname.startsWith("/api/templates") ||
    pathname === "/api/offers"
  ) {
    return true;
  }

  if (!pathname.startsWith("/api/offers/")) return false;
  return !(
    pathname.startsWith("/api/offers/by-slug") ||
    pathname.startsWith("/api/offers/nearby") ||
    pathname === "/api/offers/cities"
  );
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  // Keep waiting SW until the user confirms "Update Now" so forms are not interrupted.
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ request }) => request.method !== "GET",
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ url, request }) => request.method === "GET" && isPrivatePath(url.pathname),
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ request, url }) =>
        request.destination === "image" ||
        url.hostname === "res.cloudinary.com" ||
        /\.(?:png|jpg|jpeg|gif|webp|svg|ico|avif)$/i.test(url.pathname),
      handler: new CacheFirst({
        cacheName: "spotzi-images",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 120,
            maxAgeSeconds: 7 * DAY,
            maxAgeFrom: "last-used",
          }),
        ],
      }),
    },
    {
      matcher: ({ request, url }) =>
        request.destination === "style" ||
        request.destination === "script" ||
        request.destination === "font" ||
        url.pathname.startsWith("/_next/static/"),
      handler: new CacheFirst({
        cacheName: "spotzi-static",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 80,
            maxAgeSeconds: 30 * DAY,
            maxAgeFrom: "last-used",
          }),
        ],
      }),
    },
    {
      matcher: ({ url, request }) =>
        request.method === "GET" &&
        (url.pathname.startsWith("/offers/") || url.pathname.startsWith("/stores/") || url.pathname.startsWith("/businesses/")),
      handler: new NetworkFirst({
        cacheName: "spotzi-offer-details",
        networkTimeoutSeconds: 4,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 40,
            // Short TTL so expired offers are not treated as current for long.
            maxAgeSeconds: HOUR,
            maxAgeFrom: "last-used",
          }),
        ],
      }),
    },
    {
      matcher: ({ url, request }) =>
        request.method === "GET" &&
        (url.pathname === "/" ||
          url.pathname === "/offers" ||
          url.pathname.startsWith("/offers-near") ||
          url.pathname.startsWith("/categories") ||
          url.pathname.startsWith("/search") ||
          url.pathname.startsWith("/api/offers/nearby") ||
          url.pathname.startsWith("/api/offers/by-slug") ||
          url.pathname === "/api/offers/cities" ||
          url.pathname.startsWith("/api/categories") ||
          url.pathname.startsWith("/api/stores")),
      handler: new NetworkFirst({
        cacheName: "spotzi-discovery",
        networkTimeoutSeconds: 3,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 60,
            maxAgeSeconds: 30 * 60,
            maxAgeFrom: "last-used",
          }),
        ],
      }),
    },
    {
      matcher: ({ request }) => request.mode === "navigate",
      handler: new NetworkFirst({
        cacheName: "spotzi-pages",
        networkTimeoutSeconds: 3,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 30,
            maxAgeSeconds: HOUR,
            maxAgeFrom: "last-used",
          }),
        ],
      }),
    },
  ],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
