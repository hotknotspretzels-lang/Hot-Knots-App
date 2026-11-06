export type SalesGranularity = "hourly" | "daily" | "weekly" | "monthly";

interface SalesTxLike {
  transaction_time: string;
  total: number;
}

export interface SalesBucket {
  label: string;
  value: number;
  count: number;
}

function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // shift back to Monday
  d.setDate(d.getDate() + diff);
  return d;
}

export function bucketSales(
  transactions: SalesTxLike[],
  granularity: SalesGranularity,
  day?: string,
): SalesBucket[] {
  if (granularity === "hourly") {
    const buckets: SalesBucket[] = Array.from({ length: 24 }, (_, hour) => ({
      label: `${hour}:00`,
      value: 0,
      count: 0,
    }));
    if (!day) return buckets;

    for (const t of transactions) {
      const date = new Date(t.transaction_time);
      if (localDateKey(date) !== day) continue;
      const hour = date.getHours();
      buckets[hour].value += t.total;
      buckets[hour].count += 1;
    }
    return buckets;
  }

  const groups = new Map<
    string,
    { label: string; value: number; count: number; sortKey: number }
  >();

  for (const t of transactions) {
    const date = new Date(t.transaction_time);
    let key: string;
    let label: string;
    let sortKey: number;

    if (granularity === "daily") {
      key = localDateKey(date);
      label = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      sortKey = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    } else if (granularity === "weekly") {
      const weekStart = startOfWeek(date);
      key = localDateKey(weekStart);
      label = `Week of ${weekStart.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })}`;
      sortKey = weekStart.getTime();
    } else {
      key = `${date.getFullYear()}-${date.getMonth()}`;
      label = date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
      sortKey = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
    }

    const existing = groups.get(key);
    if (existing) {
      existing.value += t.total;
      existing.count += 1;
    } else {
      groups.set(key, { label, value: t.total, count: 1, sortKey });
    }
  }

  return Array.from(groups.values())
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ label, value, count }) => ({ label, value, count }));
}
