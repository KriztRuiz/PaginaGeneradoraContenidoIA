export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function resolveBaseSlug(inputSlug: string, title: string) {
  const manualSlug = slugify(inputSlug);

  if (manualSlug) {
    return manualSlug;
  }

  return slugify(title);
}