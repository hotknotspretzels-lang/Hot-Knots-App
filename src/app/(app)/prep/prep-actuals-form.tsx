"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { savePrepActuals } from "./actions";

interface ActualsRow {
  menuItemId: string;
  menuItemName: string;
  suggestedQty: number | null;
  actualPrepQty: number | null;
  actualSoldQty: number | null;
}

export function PrepActualsForm({
  eventId,
  rows,
}: {
  eventId: string;
  rows: ActualsRow[];
}) {
  const [values, setValues] = useState(
    rows.map((r) => ({
      menuItemId: r.menuItemId,
      prep: r.actualPrepQty ?? ("" as number | ""),
      sold: r.actualSoldQty ?? ("" as number | ""),
    })),
  );

  function update(menuItemId: string, field: "prep" | "sold", value: string) {
    setValues((prev) =>
      prev.map((v) =>
        v.menuItemId === menuItemId
          ? { ...v, [field]: value === "" ? "" : Number(value) }
          : v,
      ),
    );
  }

  return (
    <form action={savePrepActuals} className="flex flex-col gap-4">
      <input type="hidden" name="event_id" value={eventId} />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Suggested</TableHead>
            <TableHead>Actual prepped</TableHead>
            <TableHead>Actual sold</TableHead>
            <TableHead>Leftover</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const v = values.find((x) => x.menuItemId === row.menuItemId)!;
            const leftover =
              v.prep !== "" && v.sold !== "" ? v.prep - v.sold : null;

            return (
              <TableRow key={row.menuItemId}>
                <TableCell className="font-medium">{row.menuItemName}</TableCell>
                <TableCell className="text-muted-foreground">
                  {row.suggestedQty ?? "—"}
                </TableCell>
                <TableCell>
                  <input type="hidden" name="menu_item_id" value={row.menuItemId} />
                  <Input
                    type="number"
                    name="actual_prep_qty"
                    min="0"
                    value={v.prep}
                    onChange={(e) => update(row.menuItemId, "prep", e.target.value)}
                    className="h-8 w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    name="actual_sold_qty"
                    min="0"
                    value={v.sold}
                    onChange={(e) => update(row.menuItemId, "sold", e.target.value)}
                    className="h-8 w-20"
                  />
                </TableCell>
                <TableCell>{leftover != null ? leftover : "—"}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Button type="submit" className="self-start">
        Save actuals
      </Button>
    </form>
  );
}
