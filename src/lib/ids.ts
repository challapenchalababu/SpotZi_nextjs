import { randomBytes } from "node:crypto";
import { slugify } from "@/lib/slug";

export function randomSlugSuffix() {
  return randomBytes(3).toString("hex");
}

type ExistsQuery = {
  exists(filter: Record<string, string>): PromiseLike<unknown>;
};

export async function uniqueSlug(model: ExistsQuery, field: string, source: string) {
  const root = slugify(source) || "item";
  let candidate = root;
  for (let attempt = 2; attempt < 40; attempt += 1) {
    const existing = await model.exists({ [field]: candidate });
    if (!existing) return candidate;
    candidate = `${root}-${attempt}`;
  }
  return `${root}-${randomSlugSuffix()}`;
}
