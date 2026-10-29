let pendingRequests = 0;
const activityListeners = new Set<() => void>();

function notifyActivity() {
  activityListeners.forEach((listener) => listener());
}

export function subscribeApiActivity(listener: () => void) {
  activityListeners.add(listener);
  return () => activityListeners.delete(listener);
}

export function apiActivityCount() {
  return pendingRequests;
}

export function trackApiActivity() {
  pendingRequests += 1;
  notifyActivity();
  let finished = false;
  return () => {
    if (finished) return;
    finished = true;
    pendingRequests = Math.max(0, pendingRequests - 1);
    notifyActivity();
  };
}

export async function api<T>(input: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !(init.body instanceof FormData) && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  const finish = trackApiActivity();
  try {
    const response = await fetch(input, { ...init, headers });
    const payload = (await response.json().catch(() => null)) as { data?: T; error?: { message?: string } } | null;
    if (!response.ok) throw new Error(payload?.error?.message || "Request failed.");
    return payload?.data as T;
  } finally {
    finish();
  }
}

export function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
