const SENSITIVE_KEY = /password|token|secret|cookie|authorization|session/i;

export function sanitizeMetadata(input?: Record<string, unknown>) {
  if (!input) return undefined;
  const output: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(input)) {
    if (SENSITIVE_KEY.test(key)) continue;
    if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      output[key] = value;
    }
  }
  return output;
}

export function safeImageUrl(value?: string | null) {
  if (!value) return undefined;
  if (value.startsWith("/uploads/")) return value;
  try {
    const url = new URL(value);
    if (url.protocol === "https:" && url.hostname === "res.cloudinary.com") return value;
  } catch {
    return undefined;
  }
  return undefined;
}

export function safeWebsiteUrl(value?: string | null) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") return url.toString();
  } catch {
    return undefined;
  }
  return undefined;
}
