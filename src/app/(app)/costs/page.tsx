import { createClient } from "@/lib/supabase/server";
import type { Event, Expense, InventoryTransaction } from "@/lib/types";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/types";
import { sumOverheadExpenses } from "@/lib/costs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarStat } from "@/components/charts";
import { CostsFilters } from "./costs-filters";
import { AddExpenseDialog } from "./add-expense-dialog";
import { deleteExpense } from "./actions";

function rangeStartDate(range: string): string | undefined {
  if (range !== "30d" && range !== "90d") return undefined;
  const now = new Date();
  now.setDate(now.getDate() - (range === "30d" ? 30 : 90));
  return now.toISOString().slice(0, 10);
}

export default async function CostsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range = "30d" } = await searchParams;
  const since = rangeStartDate(range);
  const supabase = await createClient();

  const [{ data: events }, { data: expenses }, { data: usage }] = await Promise.all([
    supabase.from("events").select("*").order("event_date", { ascending: false }),
    supabase.from("expenses").select("*").order("expense_date", { ascending: false }),
    supabase.from("inventory_transactions").select("*").eq("transaction_type", "usage"),
  ]);

  const eventList = (events ?? []) as Event[];
  const expenseList = (expenses ?? []) as Expense[];
  const usageList = (usage ?? []) as InventoryTransaction[];
  const eventNameById = new Map(eventList.map((e) => [e.id, e.name]));

  const filteredExpenses = expenseList.filter((e) => !since || e.expense_date >= since);
  const filteredUsage = usageList.filter((t) => !since || t.transaction_date >= since);

  const foodCost = filteredUsage.reduce(
    (sum, t) => sum + t.quantity * (t.unit_cost ?? 0),
    0,
  );
  const directEventExpenses = filteredExpenses
    .filter((e) => e.event_id)
    .reduce((sum, e) => sum + e.amount, 0);
  const overhead = sumOverheadExpenses(expenseList, since);
  const totalTrueCost = foodCost + directEventExpenses + overhead;

  const byCategory = new Map<string, number>();
  for (const e of filteredExpenses) {
    const label = EXPENSE_CATEGORY_LABELS[e.category];
    byCategory.set(label, (byCategory.get(label) ?? 0) + e.amount);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Costs</h1>
          <p className="text-sm text-muted-foreground">
            Non-food expenses and true cost of goods sold.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CostsFilters />
          <AddExpenseDialog events={eventList} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Food cost</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            ${foodCost.toFixed(2)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Direct event expenses
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            ${directEventExpenses.toFixed(2)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Overhead</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            ${overhead.toFixed(2)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Total true cost
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            ${totalTrueCost.toFixed(2)}
          </CardContent>
        </Card>
      </div>

      <BarStat
        title="Expenses by category"
        data={Array.from(byCategory.entries()).map(([label, value]) => ({
          label,
          value,
        }))}
        format="currency"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredExpenses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No expenses logged for this period.
              </TableCell>
            </TableRow>
          ) : (
            filteredExpenses.map((e) => (
              <TableRow key={e.id}>
                <TableCell>
                  {new Date(e.expense_date + "T00:00:00").toLocaleDateString()}
                </TableCell>
                <TableCell>{EXPENSE_CATEGORY_LABELS[e.category]}</TableCell>
                <TableCell>${e.amount.toFixed(2)}</TableCell>
                <TableCell>
                  {e.event_id ? eventNameById.get(e.event_id) ?? "—" : "Overhead"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {e.notes ?? "—"}
                </TableCell>
                <TableCell>
                  <form action={deleteExpense}>
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="event_id" value={e.event_id ?? ""} />
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
    </div>
  );
}
