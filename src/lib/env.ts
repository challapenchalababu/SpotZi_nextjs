const DEV_AUTH_SECRET = "dev-only-loco-secret-change-before-production";
const BUILD_AUTH_SECRET = "build-time-placeholder-secret-not-for-runtime";

export function getAppUrl() {
  const value = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return value.replace(/\/$/, "");
}

export function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NEXT_PHASE === "phase-production-build") return BUILD_AUTH_SECRET;
  if (process.env.NODE_ENV !== "production") return DEV_AUTH_SECRET;
  throw new Error("AUTH_SECRET must be at least 32 characters.");
}

export function isPreviewMode() {
  return process.env.NODE_ENV !== "production" && !process.env.MONGODB_URI;
}

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

export function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.EMAIL_FROM);
}

export function imageStorageMode(): "cloudinary" | "local-dev" | "unconfigured" {
  if (isCloudinaryConfigured()) return "cloudinary";
  if (process.env.NODE_ENV !== "production") return "local-dev";
  return "unconfigured";
}

export const APP_NAME = "SpotZi";
export const DEFAULT_TIMEZONE = "Asia/Kolkata";
export const CURRENCY = "INR";
