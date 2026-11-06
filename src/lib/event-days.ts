function formatTime(time: string | null): string | null {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(hours, minutes);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function formatTimeRange(
  start: string | null,
  end: string | null,
): string | null {
  const from = formatTime(start);
  const to = formatTime(end);
  if (from && to) return `${from} – ${to}`;
  if (from) return from;
  return to ? `Until ${to}` : null;
}

export function formatDateRange(start: string, end: string | null): string {
  const from = new Date(start + "T00:00:00").toLocaleDateString();
  if (!end || end === start) return from;
  return `${from} – ${new Date(end + "T00:00:00").toLocaleDateString()}`;
}
