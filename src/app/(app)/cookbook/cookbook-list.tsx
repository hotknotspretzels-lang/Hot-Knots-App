"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/lib/cookbook";
import { RecipeDetail } from "./recipe-detail";

export function CookbookList({ recipes }: { recipes: Recipe[] }) {
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
            </CardHeader>
            {selected ? <RecipeDetail recipe={recipe} /> : null}
          </Card>
        );
      })}
    </div>
  );
}
