export const reservedSlugs = new Set([
  "app",
  "dashboard",
  "login",
  "signup",
  "logout",
  "api",
  "admin",
  "assets",
  "static",
  "settings",
  "onboarding",
  "_next",
  "favicon.ico",
]);

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function validateSlug(value: string) {
  if (
    !/^[a-z0-9](?:[a-z0-9-]{1,62}[a-z0-9])?$/.test(value) ||
    reservedSlugs.has(value)
  )
    throw new Error("Invalid or reserved public slug");
  return value;
}

export async function uniqueSlug(
  name: string,
  exists: (slug: string) => Promise<boolean>,
) {
  let base = slugify(name) || "local-business";
  if (reservedSlugs.has(base)) base = `${base}-business`;
  for (let i = 0; i < 1000; i += 1) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    if (!(await exists(candidate))) return validateSlug(candidate);
  }
  throw new Error("Could not generate a unique public slug");
}
