"use client";

import { useState } from "react";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculatePrepYield, formatWeight, type PrepCalculator } from "@/lib/cookbook";

export function PrepDetail({ item }: { item: PrepCalculator }) {
  const [inputGrams, setInputGrams] = useState(item.defaultInputGrams);
  const { outputGrams } = calculatePrepYield(item, inputGrams);

  return (
    <CardContent className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">{item.description}</p>

      <div className="flex flex-col gap-3">
        <div className="flex items-end gap-2">
          <div className="flex flex-1 flex-col gap-1">
            <Label className="text-xs">{item.inputLabel} (g)</Label>
            <Input
              type="number"
              min="0"
              step="1"
              value={inputGrams}
              onChange={(e) => setInputGrams(Number(e.target.value) || 0)}
              className="max-w-40"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between border-b py-1">
            <span className="font-medium">Raw weight in</span>
            <span>{formatWeight(inputGrams)}</span>
          </div>
          <div className="flex justify-between pt-2 font-medium">
            <span>Expected finished weight</span>
            <span>{formatWeight(outputGrams)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Yield</span>
            <span>{item.yieldPct}%</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Steps</h3>
        <ol className="flex flex-col gap-2 text-sm text-muted-foreground">
          {item.steps.map((step, i) => (
            <li key={i} className="flex gap-2">
              <span className="font-medium text-foreground">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Notes</h3>
        <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
          {item.notes.map((note, i) => (
            <li key={i} className="flex gap-2">
              <span>•</span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </div>
    </CardContent>
  );
}
