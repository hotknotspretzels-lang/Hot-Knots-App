"use client";

import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { InventoryCount, InventoryItem, InventoryTransaction } from "@/lib/types";
import { computeActualVsTheoretical } from "@/lib/inventory-reports";

function monthLabel(monthStart: string): string {
  return new Date(monthStart + "T00:00:00").toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function addMonth(monthStart: string): string {
  const d = new Date(monthStart + "T00:00:00");
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

export function ReportsTab({
  ingredientList,
  transactionList,
  countList,
  costMap,
}: {
  ingredientList: InventoryItem[];
  transactionList: InventoryTransaction[];
  countList: InventoryCount[];
  costMap: Map<string, number>;
}) {
  const availableMonths = useMemo(() => {
    const months = new Set(countList.map((c) => c.count_date.slice(0, 7) + "-01"));
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [countList]);

  const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
  const [selectedMonth, setSelectedMonth] = useState(
    availableMonths[0] ?? currentMonth,
  );

  const rows = useMemo(
    () =>
      computeActualVsTheoretical(
        ingredientList,
        transactionList,
        countList,
        costMap,
        selectedMonth,
        addMonth(selectedMonth),
      ),
    [ingredientList, transactionList, countList, costMap, selectedMonth],
  );

  const withCounts = rows.filter((r) => r.actualUsageQty != null);
  const totalTheoreticalCost = withCounts.reduce(
    (sum, r) => sum + r.theoreticalUsageQty * r.unitCost,
    0,
  );
  const totalActualCost = withCounts.reduce(
    (sum, r) => sum + (r.actualUsageQty ?? 0) * r.unitCost,
    0,
  );
  const overallVariancePercent =
    totalTheoreticalCost > 0
      ? ((totalActualCost - totalTheoreticalCost) / totalTheoreticalCost) * 100
      : null;

  const monthOptions = Object.fromEntries(
    (availableMonths.includes(selectedMonth)
      ? availableMonths
      : [selectedMonth, ...availableMonths]
    ).map((m) => [m, monthLabel(m)]),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Actual usage is backed into from purchases and stock counts — it only
          covers ingredients with a count logged for the selected month.
        </p>
        <Select items={monthOptions} value={selectedMonth} onValueChange={(v) => v && setSelectedMonth(v)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(monthOptions).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {availableMonths.length === 0 ? (
        <p className="text-muted-foreground">
          No stock counts logged yet — log one in the Purchasing tab to start
          seeing actual-vs-theoretical variance here.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  Theoretical cost
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                ${totalTheoreticalCost.toFixed(2)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  Actual cost
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                ${totalActualCost.toFixed(2)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  Overall variance
                </CardTitle>
              </CardHeader>
              <CardContent
                className={cn(
                  "text-2xl font-semibold",
                  overallVariancePercent != null && overallVariancePercent > 0 && "text-destructive",
                )}
              >
                {overallVariancePercent != null
                  ? `${overallVariancePercent > 0 ? "+" : ""}${overallVariancePercent.toFixed(1)}%`
                  : "—"}
              </CardContent>
            </Card>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingredient</TableHead>
                <TableHead>Beginning</TableHead>
                <TableHead>Purchased</TableHead>
                <TableHead>Theoretical used</TableHead>
                <TableHead>Actual used</TableHead>
                <TableHead>Variance</TableHead>
                <TableHead>$ Impact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.inventoryItemId}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>
                    {r.beginningOnHand.toFixed(2)} {r.unitOfMeasure}
                  </TableCell>
                  <TableCell>
                    {r.purchasesQty.toFixed(2)} {r.unitOfMeasure}
                  </TableCell>
                  <TableCell>
                    {r.theoreticalUsageQty.toFixed(2)} {r.unitOfMeasure}
                  </TableCell>
                  <TableCell>
                    {r.actualUsageQty != null
                      ? `${r.actualUsageQty.toFixed(2)} ${r.unitOfMeasure}`
                      : "no count logged"}
                  </TableCell>
                  <TableCell
                    className={cn(
                      r.variancePercent != null && r.variancePercent > 0 && "text-destructive",
                    )}
                  >
                    {r.variancePercent != null
                      ? `${r.variancePercent > 0 ? "+" : ""}${r.variancePercent.toFixed(1)}%`
                      : "—"}
                  </TableCell>
                  <TableCell
                    className={cn(
                      r.varianceCost != null && r.varianceCost > 0 && "text-destructive",
                    )}
                  >
                    {r.varianceCost != null ? `$${r.varianceCost.toFixed(2)}` : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
}
