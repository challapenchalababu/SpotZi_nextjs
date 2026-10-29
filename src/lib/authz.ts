import type { Portal, UserRole } from "@/types/domain";

export function canSignInToPortal(role: UserRole, portal: Portal) {
  return role === portal;
}

export function canManageOwnBusiness(role: UserRole, ownerId: string, userId: string) {
  return role === "owner" && ownerId === userId;
}

export function canModeratePlatform(role: UserRole) {
  return role === "super_admin";
}

export function canUseCustomerFeatures(role: UserRole) {
  return role === "customer";
}

export function redirectAfterLogin(role: UserRole, nextPath?: string) {
  if (role === "customer") return safeCustomerNextPath(nextPath, "/offers");
  if (role === "owner") return "/owner/dashboard";
  return "/super-admin/dashboard";
}

export function loginPathForRole(role: UserRole) {
  if (role === "owner") return "/owner/login";
  if (role === "super_admin") return "/super-admin/login";
  return "/login";
}

export function resetPathForRole(role: UserRole) {
  if (role === "owner") return "/owner/reset-password";
  if (role === "super_admin") return "/super-admin/reset-password";
  return "/reset-password";
}

export function safeCustomerNextPath(value: string | undefined, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (value.startsWith("/owner") || value.startsWith("/super-admin") || value.startsWith("/api")) return fallback;
  if (value.includes("://") || value.includes("\\")) return fallback;
  return value;
}
