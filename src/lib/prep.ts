export interface HistoricalEventAttendance {
  id: string;
  attendance: number;
}

export interface LineItemForRate {
  event_id: string;
  menu_item_id: string;
  quantity: number;
}

export interface ItemRates {
  rates: Map<string, number>;
  eventCount: number;
  totalAttendance: number;
}

export function computeItemRates(
  events: HistoricalEventAttendance[],
  lineItems: LineItemForRate[],
): ItemRates {
  const eventIds = new Set(events.map((e) => e.id));
  const totalAttendance = events.reduce((sum, e) => sum + e.attendance, 0);

  const qtyByItem = new Map<string, number>();
  for (const li of lineItems) {
    if (!eventIds.has(li.event_id)) continue;
    qtyByItem.set(
      li.menu_item_id,
      (qtyByItem.get(li.menu_item_id) ?? 0) + li.quantity,
    );
  }

  const rates = new Map<string, number>();
  if (totalAttendance > 0) {
    for (const [itemId, qty] of qtyByItem) {
      rates.set(itemId, qty / totalAttendance);
    }
  }

  return { rates, eventCount: events.length, totalAttendance };
}

export function suggestPrepQuantities(
  rates: Map<string, number>,
  attendance: number,
): Map<string, number> {
  const suggestions = new Map<string, number>();
  for (const [itemId, rate] of rates) {
    suggestions.set(itemId, Math.ceil(rate * attendance));
  }
  return suggestions;
}
