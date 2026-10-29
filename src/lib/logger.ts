export function redactSecrets(value: string) {
  return value.replace(/mongodb(?:\+srv)?:\/\/\S+/gi, "mongodb://[redacted]");
}

export function logError(error: unknown) {
  const raw = error instanceof Error ? `${error.name}: ${error.message}\n${error.stack ?? ""}` : String(error);
  console.error(redactSecrets(raw));
}
