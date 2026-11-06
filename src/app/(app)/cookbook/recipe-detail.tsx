"use client";

import { useState } from "react";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { scaleRecipe, formatWeight, type Recipe } from "@/lib/cookbook";

export function RecipeDetail({ recipe }: { recipe: Recipe }) {
  const [units, setUnits] = useState(recipe.defaultUnits);

  const { flourGrams, componentAmounts, totalGrams, orders, bags } = scaleRecipe(
    recipe,
    units,
  );

  return (
    <CardContent className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">{recipe.description}</p>

      <div className="flex flex-col gap-3">
        <div className="flex items-end gap-2">
          <div className="flex flex-1 flex-col gap-1">
            <Label className="text-xs">Number of {recipe.unit.label}s</Label>
            <Input
              type="number"
              min="0"
              step="1"
              value={units}
              onChange={(e) => setUnits(Number(e.target.value) || 0)}
              className="max-w-40"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {recipe.presets.map((preset) => (
            <Button
              key={preset.label}
              type="button"
              variant="outline"
              size="sm"
              className={cn(preset.units === units && "border-primary text-primary")}
              onClick={() => setUnits(preset.units)}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between border-b py-1">
            <span className="font-medium">Flour</span>
            <span>{formatWeight(flourGrams)}</span>
          </div>
          {componentAmounts.map((component) => (
            <div key={component.label} className="flex justify-between border-b py-1">
              <span>{component.label}</span>
              <span>{formatWeight(component.grams)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 font-medium">
            <span>Total dough</span>
            <span>{formatWeight(totalGrams)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Yield</span>
            <span>
              {orders.toLocaleString(undefined, { maximumFractionDigits: 1 })} orders ·{" "}
              {bags.toLocaleString(undefined, { maximumFractionDigits: 2 })} flour bags
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Steps</h3>
        <ol className="flex flex-col gap-2 text-sm text-muted-foreground">
          {recipe.steps.map((step, i) => (
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
          {recipe.notes.map((note, i) => (
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
