import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, isAppError } from "@/lib/errors";
import { logError } from "@/lib/logger";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session-token";

export function jsonOk(data: unknown, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function handleError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: { code: "validation_error", message: "Check the highlighted fields.", details: error.flatten() } },
      { status: 400 },
    );
  }
  if (isAppError(error)) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message, details: error.details } },
      { status: error.status },
    );
  }
  logError(error);
  return NextResponse.json(
    { error: { code: "internal_error", message: "Something went wrong. Please try again." } },
    { status: 500 },
  );
}

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new AppError(400, "invalid_json", "Request body must be JSON.");
  }
}

export function queryObject(request: Request) {
  return Object.fromEntries(new URL(request.url).searchParams.entries());
}

export function cleanQuery(request: Request) {
  return Object.fromEntries(Object.entries(queryObject(request)).filter(([, value]) => value !== ""));
}

export function parseSchema<T>(
  schema: { safeParse: (value: unknown) => { success: true; data: T } | { success: false; error: unknown } },
  value: unknown,
): T {
  const result = schema.safeParse(value);
  if (!result.success) throw result.error;
  return result.data;
}

export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

export function assertSameOrigin(request: Request) {
  if (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS") return;
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) {
    throw new AppError(403, "forbidden", "Cross-site requests are not allowed.");
  }
  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new AppError(403, "forbidden", "Cross-site requests are not allowed.");
  }
  if (originHost !== host) {
    throw new AppError(403, "forbidden", "Cross-site requests are not allowed.");
  }
}

export function withSession(response: NextResponse, token: string) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}

export function clearSession(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

type Handler<T extends Record<string, string>> = (
  request: Request,
  context: { params: Promise<T> },
) => Promise<Response>;

export function withApi<T extends Record<string, string> = Record<string, string>>(handler: Handler<T>) {
  return async (request: Request, context: { params: Promise<T> }) => {
    try {
      assertSameOrigin(request);
      return await handler(request, context);
    } catch (error) {
      return handleError(error);
    }
  };
}
