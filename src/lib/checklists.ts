import type { Checklist, ChecklistItem } from "@/lib/types";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID.test(value);
}

/** Whole number from 1 through 1,000,000, or null when the text is not one. */
export function parsePositiveInt(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  if (!Number.isSafeInteger(value) || value < 1 || value > 1_000_000) return null;
  return value;
}

/** Positive quantity, or null when blank or not a number. */
export function parseQuantity(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed || !/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0 || value > 1_000_000) return null;
  return value;
}

function asNumber(value: number | string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

export function normalizeChecklist(row: {
  id: string;
  name: string;
  base_customer_count: number | string;
  expected_customer_count: number | string | null;
  sort_order: number;
  created_at: string;
}): Checklist {
  const base = asNumber(row.base_customer_count);
  const expected = asNumber(row.expected_customer_count);
  return {
    id: row.id,
    name: row.name,
    base_customer_count: base != null && base > 0 ? base : 100,
    expected_customer_count: expected != null && expected > 0 ? expected : null,
    sort_order: row.sort_order,
    created_at: row.created_at,
  };
}

export function normalizeChecklistItem(row: {
  id: string;
  checklist_id: string;
  title: string;
  quantity: number | string | null;
  unit: string | null;
  scales: boolean;
  is_checked: boolean;
  checked_at: string | null;
  sort_order: number;
  created_at: string;
}): ChecklistItem {
  const quantity = asNumber(row.quantity);
  return {
    id: row.id,
    checklist_id: row.checklist_id,
    title: row.title,
    quantity: quantity != null && quantity > 0 ? quantity : null,
    unit: row.unit?.trim() ? row.unit.trim() : null,
    scales: row.scales !== false,
    is_checked: row.is_checked === true,
    checked_at: row.checked_at,
    sort_order: row.sort_order,
    created_at: row.created_at,
  };
}

/**
 * Quantity to pack. Scalable items use expected / base and round up to a
 * whole unit. An exact whole number stays as it is. Fixed items and a missing
 * expected count use the stored quantity, also rounded up.
 */
export function packQuantity(
  item: { quantity: number | null; scales: boolean },
  baseCustomers: number,
  expectedCustomers: number | null,
): number | null {
  if (item.quantity == null || item.quantity <= 0) return null;
  const milli = Math.round(item.quantity * 1000);
  if (milli <= 0) return null;

  const scale =
    item.scales &&
    expectedCustomers != null &&
    expectedCustomers > 0 &&
    baseCustomers > 0;

  if (!scale) return ceilDiv(milli, 1000);
  return ceilDiv(milli * expectedCustomers, baseCustomers * 1000);
}

function ceilDiv(numerator: number, denominator: number): number {
  if (denominator <= 0 || numerator <= 0) return 0;
  return Math.floor((numerator + denominator - 1) / denominator);
}

export function formatPackQuantity(amount: number, unit: string | null): string {
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(amount);
  const trimmed = unit?.trim();
  return trimmed ? `${formatted} ${trimmed}` : formatted;
}

export function formatStoredQuantity(amount: number): string {
  const rounded = Math.round(amount * 1000) / 1000;
  return String(rounded);
}

export function scaleSummary(baseCustomers: number, expectedCustomers: number | null): string {
  if (expectedCustomers == null) {
    return `Amounts are for ${baseCustomers.toLocaleString("en-US")} customers. Enter a headcount to scale them.`;
  }
  if (expectedCustomers === baseCustomers) {
    return `Amounts for ${expectedCustomers.toLocaleString("en-US")} customers.`;
  }
  return `Amounts for ${expectedCustomers.toLocaleString("en-US")} customers, scaled from ${baseCustomers.toLocaleString("en-US")} and rounded up. Fixed items stay the same.`;
}
