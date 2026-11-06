import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  Contact,
  Event,
  EventDay,
  Expense,
  InventoryTransaction,
  MenuItem,
  SalesLineItem,
  SalesTransaction,
} from "@/lib/types";
import { EVENT_TYPE_LABELS } from "@/lib/types";
import { formatDateRange, formatTimeRange } from "@/lib/event-days";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { LogSaleDialog } from "./log-sale-dialog";
import { EditEventForm } from "./edit-event-form";
import { EditScheduleForm } from "./edit-schedule-form";
import { DeleteEventDialog } from "./delete-event-dialog";
import { deleteSalesTransaction } from "@/app/(app)/sales/actions";

type TransactionWithItems = SalesTransaction & {
  sales_line_items: (SalesLineItem & { menu_items: { name: string } | null })[];
};

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: event },
    { data: menuItems },
    { data: transactions },
    { data: usage },
    { data: expenses },
    { data: days },
  ] = await Promise.all([
    supabase.from("events").select("*").eq("id", id).single(),
    supabase
      .from("menu_items")
      .select("*")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("sales_transactions")
      .select("*, sales_line_items(*, menu_items(name))")
      .eq("event_id", id)
      .order("transaction_time", { ascending: false }),
    supabase
      .from("inventory_transactions")
      .select("*")
      .eq("event_id", id)
      .eq("transaction_type", "usage"),
    supabase.from("expenses").select("*").eq("event_id", id),
    supabase
      .from("event_days")
      .select("*")
      .eq("event_id", id)
      .order("day_date", { ascending: true }),
  ]);

  if (!event) notFound();

  const eventRow = event as Event;
  const menuItemList = (menuItems ?? []) as MenuItem[];
  const transactionList = (transactions ?? []) as TransactionWithItems[];
  const usageList = (usage ?? []) as InventoryTransaction[];
  const expenseList = (expenses ?? []) as Expense[];
  const dayList = (days ?? []) as EventDay[];

  const contact = eventRow.contact_id
    ? ((
        await supabase
          .from("contacts")
          .select("*")
          .eq("id", eventRow.contact_id)
          .maybeSingle()
      ).data as Contact | null)
    : null;

  const totals = transactionList.reduce(
    (acc, t) => ({
      gross: acc.gross + t.subtotal,
      net: acc.net + t.total,
      count: acc.count + 1,
    }),
    { gross: 0, net: 0, count: 0 },
  );

  const foodCost = usageList.reduce(
    (sum, t) => sum + t.quantity * (t.unit_cost ?? 0),
    0,
  );
  const eventExpenses = expenseList.reduce((sum, e) => sum + e.amount, 0);
  // Flat fee plus any percentage-of-gross-sales cut the event takes.
  const boothFee =
    (eventRow.booth_fee ?? 0) +
    (totals.gross * (eventRow.booth_fee_percent ?? 0)) / 100;
  const trueCost = foodCost + eventExpenses + boothFee;
  const margin = totals.net - trueCost;

  const attendance = eventRow.actual_attendance ?? eventRow.expected_attendance;
  const salesPerAttendee = attendance ? totals.net / attendance : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{eventRow.name}</h1>
          <p className="text-sm text-muted-foreground">
            {EVENT_TYPE_LABELS[eventRow.event_type]} ·{" "}
            {formatDateRange(eventRow.event_date, eventRow.end_date)}
            {eventRow.location ? ` · ${eventRow.location}` : ""}
            {contact ? ` · ${contact.name}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LogSaleDialog eventId={eventRow.id} menuItems={menuItemList} />
          <DeleteEventDialog
            eventId={eventRow.id}
            eventName={eventRow.name}
            transactionCount={totals.count}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Gross sales
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            ${totals.gross.toFixed(2)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Net sales
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            ${totals.net.toFixed(2)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {totals.count}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Sales / attendee
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {salesPerAttendee != null ? `$${salesPerAttendee.toFixed(2)}` : "—"}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>True cost</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
          <div>
            <p className="text-muted-foreground">Food cost</p>
            <p className="text-lg font-semibold">${foodCost.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">
              Expenses + booth fee
              {eventRow.booth_fee_percent
                ? ` (${eventRow.booth_fee_percent}% of sales)`
                : ""}
            </p>
            <p className="text-lg font-semibold">
              ${(eventExpenses + boothFee).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Total true cost</p>
            <p className="text-lg font-semibold">${trueCost.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Margin</p>
            <p className="text-lg font-semibold">${margin.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {dayList.length > 0 && (
            <ul className="flex flex-col gap-1 text-sm">
              {dayList.map((d) => (
                <li key={d.id} className="flex justify-between gap-4">
                  <span>
                    {new Date(d.day_date + "T00:00:00").toLocaleDateString(
                      undefined,
                      { weekday: "short", month: "short", day: "numeric" },
                    )}
                  </span>
                  <span className="text-muted-foreground">
                    {formatTimeRange(d.start_time, d.end_time) ?? "Time TBD"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <EditScheduleForm
            key={dayList
              .map((d) => `${d.day_date}${d.start_time}${d.end_time}`)
              .join("|")}
            eventId={eventRow.id}
            defaultDate={eventRow.event_date}
            days={dayList}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Event details</CardTitle>
        </CardHeader>
        <CardContent>
          <EditEventForm event={eventRow} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Total</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactionList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No sales logged for this event yet.
                  </TableCell>
                </TableRow>
              ) : (
                transactionList.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      {new Date(t.transaction_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      {t.sales_line_items
                        .map(
                          (li) =>
                            `${li.quantity}× ${li.menu_items?.name ?? "Item"}`,
                        )
                        .join(", ")}
                    </TableCell>
                    <TableCell className="capitalize">{t.payment_method}</TableCell>
                    <TableCell>${t.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <form action={deleteSalesTransaction}>
                        <input type="hidden" name="id" value={t.id} />
                        <input type="hidden" name="event_id" value={eventRow.id} />
                        <Button variant="ghost" size="sm" type="submit">
                          Delete
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
