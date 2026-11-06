"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { savePrepPlan } from "./actions";

interface SuggestionRow {
  menuItemId: string;
  menuItemName: string;
  rate: number;
  suggestedQty: number;
}

export function SavePrepPlanForm({
  eventId,
  rows,
  basisNotes,
}: {
  eventId: string;
  rows: SuggestionRow[];
  basisNotes: string;
}) {
  return (
    <form action={savePrepPlan} className="flex flex-col gap-4">
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="basis_notes" value={basisNotes} />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Rate (per attendee)</TableHead>
            <TableHead>Suggested prep qty</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.menuItemId}>
              <TableCell className="font-medium">{row.menuItemName}</TableCell>
              <TableCell className="text-muted-foreground">
                {row.rate.toFixed(3)}
              </TableCell>
              <TableCell>
                {row.suggestedQty}
                <input
                  type="hidden"
                  name="menu_item_id"
                  value={row.menuItemId}
                />
                <input
                  type="hidden"
                  name="suggested_qty"
                  value={row.suggestedQty}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Button type="submit" className="self-start">
        Save prep plan
      </Button>
    </form>
  );
}
