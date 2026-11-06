import type { InventoryItem, InventoryItemComponent, RecipeComponent } from "@/lib/types";

export function resolveIngredientCosts(
  ingredients: InventoryItem[],
  components: InventoryItemComponent[],
): Map<string, number> {
  const itemsById = new Map(ingredients.map((i) => [i.id, i]));
  const childrenByParent = new Map<string, InventoryItemComponent[]>();
  for (const c of components) {
    const list = childrenByParent.get(c.parent_item_id) ?? [];
    list.push(c);
    childrenByParent.set(c.parent_item_id, list);
  }

  const memo = new Map<string, number>();

  function cost(id: string, visiting: Set<string>): number {
    if (memo.has(id)) return memo.get(id)!;

    const item = itemsById.get(id);
    if (!item) return 0;

    if (!item.is_prepared) {
      const c = item.current_unit_cost ?? 0;
      memo.set(id, c);
      return c;
    }

    if (visiting.has(id)) {
      // circular reference in the recipe graph — treat as unresolvable
      return 0;
    }
    visiting.add(id);

    const comps = childrenByParent.get(id) ?? [];
    const total = comps.reduce(
      (sum, comp) => sum + cost(comp.component_item_id, visiting) * comp.quantity,
      0,
    );

    visiting.delete(id);

    const yieldQty = item.yield_quantity && item.yield_quantity > 0 ? item.yield_quantity : 1;
    const result = total / yieldQty;
    memo.set(id, result);
    return result;
  }

  for (const item of ingredients) {
    cost(item.id, new Set());
  }

  return memo;
}

export function computeRecipeCost(
  recipeComponents: Pick<RecipeComponent, "inventory_item_id" | "quantity_per_unit">[],
  costMap: Map<string, number>,
): number {
  return recipeComponents.reduce(
    (sum, rc) => sum + (costMap.get(rc.inventory_item_id) ?? 0) * rc.quantity_per_unit,
    0,
  );
}
