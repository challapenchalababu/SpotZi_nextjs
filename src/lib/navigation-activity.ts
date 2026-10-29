let pendingNavigations = 0;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribeNavigationActivity(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function navigationActivityCount() {
  return pendingNavigations;
}

export function beginNavigation() {
  pendingNavigations += 1;
  notify();
}

export function endNavigation() {
  pendingNavigations = 0;
  notify();
}
