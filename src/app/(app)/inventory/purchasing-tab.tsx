import type { InventoryCount, InventoryItem, InventoryTransaction } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PurchaseForm } from "./purchase-form";
import { CountForm } from "./count-form";

export function PurchasingTab({
  ingredientList,
  transactionList,
  countList,
}: {
  ingredientList: InventoryItem[];
  transactionList: InventoryTransaction[];
  countList: InventoryCount[];
}) {
  const nameById = new Map(ingredientList.map((i) => [i.id, i.name]));

  const purchases = transactionList
    .filter((t) => t.transaction_type === "purchase")
    .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));

  const monthStart = new Date().toISOString().slice(0, 7) + "-01";
  const monthTotal = purchases
    .filter((t) => t.transaction_date >= monthStart)
    .reduce((sum, t) => sum + t.quantity * (t.unit_cost ?? 0), 0);

  const counts = [...countList].sort((a, b) => b.count_date.localeCompare(a.count_date));

  return (
    <div className="flex flex-col gap-6">
      <PurchaseForm ingredients={ingredientList} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-baseline justify-between">
            <span>Purchase history</span>
            <span className="text-sm font-normal text-muted-foreground">
              This month: ${monthTotal.toFixed(2)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Ingredient</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Cost/unit</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No purchases logged yet.
                  </TableCell>
                </TableRow>
              ) : (
                purchases.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      {new Date(t.transaction_date + "T00:00:00").toLocaleDateString()}
                    </TableCell>
                    <TableCell>{nameById.get(t.inventory_item_id) ?? "Unknown"}</TableCell>
                    <TableCell>{t.quantity}</TableCell>
                    <TableCell>
                      {t.unit_cost != null ? `$${t.unit_cost.toFixed(4)}` : "—"}
                    </TableCell>
                    <TableCell>
                      {t.unit_cost != null
                        ? `$${(t.quantity * t.unit_cost).toFixed(2)}`
                        : "—"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {t.notes ?? "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CountForm ingredients={ingredientList} />

      <Card>
        <CardHeader>
          <CardTitle>Count history</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Ingredient</TableHead>
                <TableHead>Counted quantity</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {counts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No stock counts logged yet.
                  </TableCell>
                </TableRow>
              ) : (
                counts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      {new Date(c.count_date + "T00:00:00").toLocaleDateString()}
                    </TableCell>
                    <TableCell>{nameById.get(c.inventory_item_id) ?? "Unknown"}</TableCell>
                    <TableCell>{c.counted_quantity}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {c.notes ?? "—"}
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
