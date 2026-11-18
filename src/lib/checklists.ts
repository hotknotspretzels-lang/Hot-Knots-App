const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID.test(value);
}

export function parseChecklistName(raw: unknown): string | null {
  const name = String(raw ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (!name || name.length > 120) return null;
  return name;
}

export function parseItemTitle(raw: unknown): string | null {
  const title = String(raw ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (!title || title.length > 200) return null;
  return title;
}
