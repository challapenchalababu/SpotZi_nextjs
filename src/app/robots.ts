import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const appUrl = getAppUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/owner", "/super-admin", "/api/", "/favorites", "/my-redemptions", "/profile", "/login", "/register", "/forgot-password", "/reset-password", "/search"],
    },
    sitemap: `${appUrl}/sitemap.xml`,
    host: appUrl,
  };
}
