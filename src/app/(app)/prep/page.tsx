import { createClient } from "@/lib/supabase/server";
import type { Event, MenuItem } from "@/lib/types";
import { computeItemRates, suggestPrepQuantities } from "@/lib/prep";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrepControls } from "./prep-controls";
import { SavePrepPlanForm } from "./save-prep-plan-form";
import { PrepActualsForm } from "./prep-actuals-form";
import { savePrepPlan } from "./actions";
import { Button } from "@/components/ui/button";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default async function PrepPage({
  searchParams,
}: {
  searchParams: Promise<{ event_id?: string; attendance?: string }>;
}) {
  const { event_id: eventIdParam, attendance: attendanceParam } = await searchParams;
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: false });
  const eventList = (events ?? []) as Event[];

  if (eventList.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">Prep</h1>
        <p className="text-muted-foreground">
          Add an event first, then come back here to get a prep plan.
        </p>
      </div>
    );
  }

  const today = todayISO();
  const upcoming = eventList
    .filter((e) => e.status === "planned" && e.event_date >= today)
    .sort((a, b) => a.event_date.localeCompare(b.event_date))[0];
  const defaultEvent = upcoming ?? eventList[0];
  const selectedEvent =
    eventList.find((e) => e.id === eventIdParam) ?? defaultEvent;

  const attendance = attendanceParam
    ? Number(attendanceParam)
    : selectedEvent.expected_attendance ?? undefined;

  const cutoff = daysAgoISO(90);
  const historicalEvents = eventList.filter(
    (e) =>
      e.id !== selectedEvent.id &&
      e.event_date >= cutoff &&
      e.event_date <= today &&
      (e.actual_attendance ?? e.expected_attendance) != null,
  );
  const historicalEventIds = historicalEvents.map((e) => e.id);

  interface TxWithLines {
    event_id: string;
    sales_line_items: { menu_item_id: string; quantity: number }[];
  }

  const { data: transactions } =
    historicalEventIds.length > 0
      ? await supabase
          .from("sales_transactions")
          .select("event_id, sales_line_items(menu_item_id, quantity)")
          .in("event_id", historicalEventIds)
      : { data: [] as TxWithLines[] };

  const lineItems = ((transactions ?? []) as unknown as TxWithLines[]).flatMap((t) =>
    t.sales_line_items.map((li) => ({
      event_id: t.event_id,
      menu_item_id: li.menu_item_id,
      quantity: li.quantity,
    })),
  );

  const { rates, eventCount, totalAttendance } = computeItemRates(
    historicalEvents.map((e) => ({
      id: e.id,
      attendance: (e.actual_attendance ?? e.expected_attendance)!,
    })),
    lineItems,
  );

  const { data: menuItems } = await supabase
    .from("menu_items")
    .select("*")
    .eq("is_active", true);
  const menuItemList = (menuItems ?? []) as MenuItem[];
  const nameById = new Map(menuItemList.map((m) => [m.id, m.name]));

  const { data: existingPlan } = await supabase
    .from("prep_forecasts")
    .select("*")
    .eq("event_id", selectedEvent.id);
  const planRows = existingPlan ?? [];
  const planExists = planRows.length > 0;

  const basisNotes = `Based on ${eventCount} event${eventCount === 1 ? "" : "s"} / ${totalAttendance} total attendees over the last 3 months`;

  const suggestions: Map<string, number> =
    attendance != null ? suggestPrepQuantities(rates, attendance) : new Map();

  const suggestionRows = Array.from(rates.entries())
    .map(([menuItemId, rate]) => ({
      menuItemId,
      menuItemName: nameById.get(menuItemId) ?? "Unknown item",
      rate,
      suggestedQty: suggestions.get(menuItemId) ?? 0,
    }))
    .sort((a, b) => b.suggestedQty - a.suggestedQty);

  const actualsRows = planRows
    .map((p) => ({
      menuItemId: p.menu_item_id,
      menuItemName: nameById.get(p.menu_item_id) ?? "Unknown item",
      suggestedQty: p.suggested_prep_qty,
      actualPrepQty: p.actual_prep_qty,
      actualSoldQty: p.actual_sold_qty,
    }))
    .sort((a, b) => (b.suggestedQty ?? 0) - (a.suggestedQty ?? 0));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Prep</h1>
        <p className="text-sm text-muted-foreground">
          Prep quantity suggestions based on your normal per-attendee sell-through
          over the last 3 months.
        </p>
      </div>

      <PrepControls
        events={eventList}
        selectedEventId={selectedEvent.id}
        attendance={attendance != null ? String(attendance) : ""}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Basis</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">{basisNotes}</CardContent>
      </Card>

      {attendance == null ? (
        <p className="text-muted-foreground">
          Enter an estimated attendance to see prep suggestions.
        </p>
      ) : suggestionRows.length === 0 && !planExists ? (
        <p className="text-muted-foreground">
          No sales history in the last 3 months yet — not enough data for a prep
          suggestion.
        </p>
      ) : planExists ? (
        <div className="flex flex-col gap-4">
          <form action={savePrepPlan}>
            <input type="hidden" name="event_id" value={selectedEvent.id} />
            <input type="hidden" name="basis_notes" value={basisNotes} />
            {suggestionRows.map((row) => (
              <span key={row.menuItemId}>
                <input type="hidden" name="menu_item_id" value={row.menuItemId} />
                <input
                  type="hidden"
                  name="suggested_qty"
                  value={row.suggestedQty}
                />
              </span>
            ))}
            <Button type="submit" variant="outline" size="sm">
              Regenerate suggestions
            </Button>
          </form>
          <PrepActualsForm eventId={selectedEvent.id} rows={actualsRows} />
        </div>
      ) : (
        <SavePrepPlanForm
          eventId={selectedEvent.id}
          rows={suggestionRows}
          basisNotes={basisNotes}
        />
      )}
    </div>
  );
}
