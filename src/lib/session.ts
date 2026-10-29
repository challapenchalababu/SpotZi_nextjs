import { cookies, headers } from "next/headers";
import { previewSession } from "@/data/preview-store";
import { connectDB } from "@/lib/db";
import { isPreviewMode } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";
import { UserModel } from "@/models";
import type { SessionUser, UserRole } from "@/types/domain";

const PREVIEW_COOKIE = "lo_preview_role";

export async function getSession(): Promise<SessionUser | null> {
  if (isPreviewMode()) {
    const headerRole = (await headers()).get("x-loco-preview");
    const cookieRole = (await cookies()).get(PREVIEW_COOKIE)?.value;
    const role = headerRole || cookieRole;
    if (role === "customer" || role === "owner" || role === "super_admin") return previewSession(role);
  }
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload) return null;
  await connectDB();
  const user = await UserModel.findById(payload.sub).lean();
  if (!user || !user.isActive || user.role !== payload.role) return null;
  if ((user.sessionVersion ?? 0) !== payload.sessionVersion) return null;
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone || undefined,
    role: user.role,
    profileImage: user.profileImage || undefined,
  };
}

export async function requireUser() {
  const session = await getSession();
  if (!session) throw new AppError(401, "unauthorized", "Sign in to continue.");
  return session;
}

export async function requireRoles(roles: UserRole[]) {
  const session = await requireUser();
  if (!roles.includes(session.role)) {
    throw new AppError(403, "forbidden", "You do not have permission to do that.");
  }
  return session;
}
