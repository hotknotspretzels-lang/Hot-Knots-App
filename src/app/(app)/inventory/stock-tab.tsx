import type {
  InventoryItem,
  InventoryItemComponent,
  InventoryTransaction,
  RecipeComponent,
} from "@/lib/types";
import { computeOnHand, sumByItem } from "@/lib/inventory";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BarStat } from "@/components/charts";
import { InventoryFilters } from "./inventory-filters";
import { LogUsageDialog } from "./log-usage-dialog";
import { LogAdjustmentDialog } from "./log-adjustment-dialog";
import { updateParLevels, deleteInventoryItem } from "./actions";

function rangeStartDate(range: string): string | undefined {
  if (range !== "30d" && range !== "90d") return undefined;
  const now = new Date();
  now.setDate(now.getDate() - (range === "30d" ? 30 : 90));
  return now.toISOString().slice(0, 10);
}

export function StockTab({
  ingredientList,
  transactionList,
  itemComponentList,
  recipeComponentList,
  range,
}: {
  ingredientList: InventoryItem[];
  transactionList: InventoryTransaction[];
  itemComponentList: InventoryItemComponent[];
  recipeComponentList: RecipeComponent[];
  range: string;
}) {
  const nameById = new Map(ingredientList.map((i) => [i.id, i.name]));

  const onHand = computeOnHand(transactionList);
  const since = rangeStartDate(range);
  const usageSums = sumByItem(transactionList, ["usage"], since);
  const wasteSums = sumByItem(transactionList, ["waste"], since);

  const itemsWithHistory = new Set(transactionList.map((t) => t.inventory_item_id));
  const itemsInUse = new Set([
    ...recipeComponentList.map((rc) => rc.inventory_item_id),
    ...itemComponentList.map((ic) => ic.component_item_id),
  ]);

  const toChartData = (sums: Map<string, number>) =>
    Array.from(sums.entries())
      .map(([id, value]) => ({ label: nameById.get(id) ?? "Unknown", value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

  const reorderItems = ingredientList.filter((i) => {
    if (i.reorder_point == null) return false;
    return (onHand.get(i.id) ?? 0) <= i.reorder_point;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <InventoryFilters />
      </div>

      {reorderItems.length > 0 ? (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-sm">
              Reorder needed ({reorderItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {reorderItems.map((i) => (
              <Badge key={i.id} variant="destructive">
                {i.name} — {(onHand.get(i.id) ?? 0).toFixed(1)} {i.unit_of_measure} left
              </Badge>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>On hand</TableHead>
            <TableHead>Par / Reorder</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {ingredientList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No ingredients yet. Add them from Menu &amp; Recipes &gt; Ingredients
                first.
              </TableCell>
            </TableRow>
          ) : (
            ingredientList.map((item) => {
              const stock = onHand.get(item.id) ?? 0;
              const isReorder = item.reorder_point != null && stock <= item.reorder_point;
              const isLow =
                !isReorder && item.par_level != null && stock < item.par_level;

              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant={item.is_prepared ? "secondary" : "outline"}>
                      {item.is_prepared ? "Prepared" : "Raw"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {stock.toFixed(2)} {item.unit_of_measure}
                  </TableCell>
                  <TableCell>
                    <form action={updateParLevels} className="flex items-center gap-1">
                      <input type="hidden" name="id" value={item.id} />
                      <Input
                        type="number"
                        name="par_level"
                        step="0.01"
                        min="0"
                        placeholder="Par"
                        defaultValue={item.par_level ?? ""}
                        className="h-8 w-20"
                      />
                      <Input
                        type="number"
                        name="reorder_point"
                        step="0.01"
                        min="0"
                        placeholder="Reorder"
                        defaultValue={item.reorder_point ?? ""}
                        className="h-8 w-20"
                      />
                      <Button type="submit" size="sm" variant="outline">
                        Save
                      </Button>
                    </form>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={isReorder ? "destructive" : isLow ? "secondary" : "outline"}
                    >
                      {isReorder ? "Reorder now" : isLow ? "Low" : "OK"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <LogUsageDialog
                        inventoryItemId={item.id}
                        itemName={item.name}
                        unitOfMeasure={item.unit_of_measure}
                      />
                      <LogAdjustmentDialog
                        inventoryItemId={item.id}
                        itemName={item.name}
                        unitOfMeasure={item.unit_of_measure}
                      />
                      {!itemsWithHistory.has(item.id) && !itemsInUse.has(item.id) ? (
                        <form action={deleteInventoryItem}>
                          <input type="hidden" name="id" value={item.id} />
                          <Button
                            type="submit"
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                          >
                            Delete
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BarStat
          title="Usage by ingredient"
          data={toChartData(usageSums)}
          format="number"
          tooltipLabel="Used"
        />
        <BarStat
          title="Waste by ingredient"
          data={toChartData(wasteSums)}
          format="number"
          tooltipLabel="Wasted"
        />
      </div>
    </div>
  );
}
