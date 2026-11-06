"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PrepCalculator } from "@/lib/cookbook";
import { PrepDetail } from "./prep-detail";

export function PrepCalculatorList({ items }: { items: PrepCalculator[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => {
        const selected = item.id === selectedId;
        return (
          <Card key={item.id}>
            <CardHeader
              className={cn(
                "cursor-pointer select-none",
                selected && "border-b pb-(--card-spacing)",
              )}
              onClick={() => setSelectedId(selected ? null : item.id)}
            >
              <CardTitle>{item.name}</CardTitle>
              <CardDescription>{item.category}</CardDescription>
            </CardHeader>
            {selected ? <PrepDetail item={item} /> : null}
          </Card>
        );
      })}
    </div>
  );
}
