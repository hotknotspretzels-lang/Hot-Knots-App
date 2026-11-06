"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DipRecipe } from "@/lib/cookbook";
import { DipDetail } from "./dip-detail";

export function DipRecipeList({ recipes }: { recipes: DipRecipe[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {recipes.map((recipe) => {
        const selected = recipe.id === selectedId;
        return (
          <Card key={recipe.id}>
            <CardHeader
              className={cn(
                "cursor-pointer select-none",
                selected && "border-b pb-(--card-spacing)",
              )}
              onClick={() => setSelectedId(selected ? null : recipe.id)}
            >
              <CardTitle>{recipe.name}</CardTitle>
              <CardDescription>{recipe.category}</CardDescription>
            </CardHeader>
            {selected ? <DipDetail recipe={recipe} /> : null}
          </Card>
        );
      })}
    </div>
  );
}
