import { SignJWT, jwtVerify } from "jose";
import { getAuthSecret } from "@/lib/env";
import type { UserRole } from "@/types/domain";
import { USER_ROLES } from "@/types/domain";

export const SESSION_COOKIE = "lo_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export interface SessionToken {
  sub: string;
  role: UserRole;
  email: string;
  name: string;
  sessionVersion: number;
}

function secretKey() {
  return new TextEncoder().encode(getAuthSecret());
}

export async function signSessionToken(user: {
  id: string;
  role: UserRole;
  email: string;
  name: string;
  sessionVersion: number;
}) {
  return new SignJWT({
    role: user.role,
    email: user.email,
    name: user.name,
    sv: user.sessionVersion,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionToken | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const role = payload.role;
    if (!payload.sub || typeof role !== "string" || !USER_ROLES.includes(role as UserRole)) return null;
    return {
      sub: payload.sub,
      role: role as UserRole,
      email: typeof payload.email === "string" ? payload.email : "",
      name: typeof payload.name === "string" ? payload.name : "",
      sessionVersion: typeof payload.sv === "number" ? payload.sv : 0,
    };
  } catch {
    return null;
  }
}
