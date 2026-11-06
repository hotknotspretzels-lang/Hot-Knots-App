import { createClient } from "@/lib/supabase/server";
import type {
  InventoryItem,
  InventoryItemComponent,
  MenuCategory,
  MenuItem,
  RecipeComponent,
} from "@/lib/types";
import { resolveIngredientCosts, computeRecipeCost } from "@/lib/costing";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddCategoryDialog } from "./add-category-dialog";
import { AddItemDialog } from "./add-item-dialog";
import { AddIngredientDialog } from "./add-ingredient-dialog";
import { RecipeDialog } from "./recipe-dialog";
import { LogWasteDialog } from "./log-waste-dialog";
import { toggleMenuItemActive, deleteMenuItem, updateIngredientCost } from "./actions";

export async function MenuTabContent() {
  const supabase = await createClient();

  const [
    { data: categories },
    { data: items },
    { data: ingredients },
    { data: itemComponents },
    { data: recipeComponents },
    { data: soldLineItems },
  ] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase.from("menu_items").select("*").order("name", { ascending: true }),
    supabase.from("inventory_items").select("*").order("name", { ascending: true }),
    supabase.from("inventory_item_components").select("*"),
    supabase.from("recipe_components").select("*"),
    supabase.from("sales_line_items").select("menu_item_id"),
  ]);

  const categoryList = (categories ?? []) as MenuCategory[];
  const itemList = (items ?? []) as MenuItem[];
  const ingredientList = (ingredients ?? []) as InventoryItem[];
  const itemComponentList = (itemComponents ?? []) as InventoryItemComponent[];
  const recipeComponentList = (recipeComponents ?? []) as RecipeComponent[];
  const soldItemIds = new Set(
    (soldLineItems ?? []).map((r) => (r as { menu_item_id: string }).menu_item_id),
  );

  const costMap = resolveIngredientCosts(ingredientList, itemComponentList);

  const categoryName = (id: string | null) =>
    categoryList.find((c) => c.id === id)?.name ?? "Uncategorized";

  const recipeRowsFor = (menuItemId: string) =>
    recipeComponentList
      .filter((rc) => rc.menu_item_id === menuItemId)
      .map((rc) => ({ componentId: rc.inventory_item_id, quantity: rc.quantity_per_unit }));

  const componentRowsFor = (parentItemId: string) =>
    itemComponentList
      .filter((c) => c.parent_item_id === parentItemId)
      .map((c) => ({ componentId: c.component_item_id, quantity: c.quantity }));

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Menu items, ingredients, and the recipes that tell the system how much of each
        ingredient a sale should consume.
      </p>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Menu Items</TabsTrigger>
          <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="flex flex-col gap-4">
          <div className="flex flex-wrap justify-end gap-2">
            <AddCategoryDialog />
            <AddItemDialog categories={categoryList} />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Theoretical cost</TableHead>
                <TableHead>Cost %</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No menu items yet. Add your first item to get started.
                  </TableCell>
                </TableRow>
              ) : (
                itemList.map((item) => {
                  const rows = recipeRowsFor(item.id);
                  const cost = computeRecipeCost(
                    rows.map((r) => ({
                      inventory_item_id: r.componentId,
                      quantity_per_unit: r.quantity,
                    })),
                    costMap,
                  );
                  const costPercent = item.price > 0 ? (cost / item.price) * 100 : null;

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{categoryName(item.category_id)}</TableCell>
                      <TableCell>${item.price.toFixed(2)}</TableCell>
                      <TableCell>
                        {rows.length > 0 ? `$${cost.toFixed(2)}` : "No recipe"}
                      </TableCell>
                      <TableCell>
                        {costPercent != null && rows.length > 0
                          ? `${costPercent.toFixed(0)}%`
                          : "—"}
                      </TableCell>
                      <TableCell>{item.unit_of_measure}</TableCell>
                      <TableCell>
                        <Badge variant={item.is_active ? "default" : "secondary"}>
                          {item.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <RecipeDialog
                            targetType="menu_item"
                            targetId={item.id}
                            targetName={item.name}
                            ingredients={ingredientList}
                            costMap={costMap}
                            existingRows={rows}
                          />
                          <form action={toggleMenuItemActive}>
                            <input type="hidden" name="id" value={item.id} />
                            <input
                              type="hidden"
                              name="is_active"
                              value={String(item.is_active)}
                            />
                            <Button variant="ghost" size="sm" type="submit">
                              {item.is_active ? "Deactivate" : "Activate"}
                            </Button>
                          </form>
                          {!soldItemIds.has(item.id) ? (
                            <form action={deleteMenuItem}>
                              <input type="hidden" name="id" value={item.id} />
                              <Button variant="ghost" size="sm" type="submit">
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
        </TabsContent>

        <TabsContent value="ingredients" className="flex flex-col gap-4">
          <div className="flex justify-end">
            <AddIngredientDialog />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Cost/unit</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Category</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredientList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No ingredients yet. Add raw ingredients and batch-prepped items
                    (sauces, doughs, etc.) here.
                  </TableCell>
                </TableRow>
              ) : (
                ingredientList.map((ingredient) => (
                  <TableRow key={ingredient.id}>
                    <TableCell className="font-medium">{ingredient.name}</TableCell>
                    <TableCell>
                      <Badge variant={ingredient.is_prepared ? "secondary" : "outline"}>
                        {ingredient.is_prepared ? "Prepared" : "Raw"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {ingredient.is_prepared ? (
                        `$${(costMap.get(ingredient.id) ?? 0).toFixed(4)}`
                      ) : (
                        <form
                          action={updateIngredientCost}
                          className="flex items-center gap-1"
                        >
                          <input type="hidden" name="id" value={ingredient.id} />
                          <Input
                            type="number"
                            name="current_unit_cost"
                            step="0.0001"
                            min="0"
                            defaultValue={ingredient.current_unit_cost ?? ""}
                            className="h-8 w-24"
                          />
                          <Button type="submit" size="sm" variant="outline">
                            Save
                          </Button>
                        </form>
                      )}
                    </TableCell>
                    <TableCell>
                      {ingredient.is_prepared
                        ? ingredient.yield_unit_of_measure ?? ingredient.unit_of_measure
                        : ingredient.unit_of_measure}
                    </TableCell>
                    <TableCell className="capitalize">{ingredient.category}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {ingredient.is_prepared ? (
                          <RecipeDialog
                            targetType="inventory_item"
                            targetId={ingredient.id}
                            targetName={ingredient.name}
                            ingredients={ingredientList}
                            costMap={costMap}
                            existingRows={componentRowsFor(ingredient.id)}
                          />
                        ) : null}
                        <LogWasteDialog
                          inventoryItemId={ingredient.id}
                          itemName={ingredient.name}
                          unitOfMeasure={ingredient.unit_of_measure}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
