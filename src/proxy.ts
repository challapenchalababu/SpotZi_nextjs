import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";

const PREVIEW_COOKIE = "lo_preview_role";

const ownerPublic = ["/owner/login", "/owner/register", "/owner/forgot-password", "/owner/reset-password"];
const adminPublic = ["/super-admin/login", "/super-admin/forgot-password", "/super-admin/reset-password"];
const customerProtected = ["/favorites", "/my-redemptions", "/profile"];

function isPath(pathname: string, paths: string[]) {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function allowPreview(request: NextRequest, role: "customer" | "owner" | "super_admin") {
  const headers = new Headers(request.headers);
  headers.set("x-loco-preview", role);
  const response = NextResponse.next({ request: { headers } });
  response.cookies.set(PREVIEW_COOKIE, role, { httpOnly: true, sameSite: "lax", path: "/" });
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (process.env.NODE_ENV !== "production" && !process.env.MONGODB_URI) {
    if ((pathname === "/owner" || pathname.startsWith("/owner/")) && !isPath(pathname, ownerPublic)) return allowPreview(request, "owner");
    if ((pathname === "/super-admin" || pathname.startsWith("/super-admin/")) && !isPath(pathname, adminPublic)) return allowPreview(request, "super_admin");
    if (isPath(pathname, customerProtected)) return allowPreview(request, "customer");
  }
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (pathname === "/owner" || pathname.startsWith("/owner/")) {
    if (pathname === "/owner" || isPath(pathname, ownerPublic)) {
      if (session?.role === "owner") return NextResponse.redirect(new URL("/owner/dashboard", request.url));
      return NextResponse.next();
    }
    if (session?.role !== "owner") {
      const url = new URL("/owner/login", request.url);
      if (session) url.searchParams.set("error", "forbidden");
      return NextResponse.redirect(url);
    }
  }

  if (pathname === "/super-admin" || pathname.startsWith("/super-admin/")) {
    if (pathname === "/super-admin" || isPath(pathname, adminPublic)) {
      if (session?.role === "super_admin") return NextResponse.redirect(new URL("/super-admin/dashboard", request.url));
      return NextResponse.next();
    }
    if (session?.role !== "super_admin") {
      const url = new URL("/super-admin/login", request.url);
      if (session) url.searchParams.set("error", "forbidden");
      return NextResponse.redirect(url);
    }
  }

  if (isPath(pathname, customerProtected) && session?.role !== "customer") {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/owner",
    "/owner/:path*",
    "/super-admin",
    "/super-admin/:path*",
    "/favorites",
    "/my-redemptions",
    "/profile",
  ],
};
