import { AppError } from "@/lib/errors";

export async function loadPage<T>(loader: () => Promise<T>) {
  try {
    return { ok: true as const, data: await loader() };
  } catch (error) {
    if (error instanceof AppError && (error.code === "database_unconfigured" || error.code === "database_unavailable")) {
      return { ok: false as const, message: error.message };
    }
    throw error;
  }
}
