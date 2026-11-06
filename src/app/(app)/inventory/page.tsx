import { createClient } from "@/lib/supabase/server";
import type { InventoryCount, InventoryItem, InventoryItemComponent, InventoryTransaction, RecipeComponent } from "@/lib/types";
import { resolveIngredientCosts } from "@/lib/costing";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StockTab } from "./stock-tab";
import { PurchasingTab } from "./purchasing-tab";
import { ReportsTab } from "./reports-tab";
import { MenuTabContent } from "../menu/menu-tab-content";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range = "30d" } = await searchParams;
  const supabase = await createClient();

  const [
    { data: ingredients },
    { data: transactions },
    { data: counts },
    { data: itemComponents },
    { data: recipeComponents },
  ] = await Promise.all([
    supabase.from("inventory_items").select("*").order("name", { ascending: true }),
    supabase.from("inventory_transactions").select("*"),
    supabase.from("inventory_counts").select("*"),
    supabase.from("inventory_item_components").select("*"),
    supabase.from("recipe_components").select("*"),
  ]);

  const ingredientList = (ingredients ?? []) as InventoryItem[];
  const transactionList = (transactions ?? []) as InventoryTransaction[];
  const countList = (counts ?? []) as InventoryCount[];
  const itemComponentList = (itemComponents ?? []) as InventoryItemComponent[];
  const recipeComponentList = (recipeComponents ?? []) as RecipeComponent[];

  const costMap = resolveIngredientCosts(ingredientList, itemComponentList);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Inventory</h1>
        <p className="text-sm text-muted-foreground">
          Stock on hand, purchasing, menu recipes, and actual-vs-theoretical
          reporting.
        </p>
      </div>

      <Tabs defaultValue="stock">
        <div className="overflow-x-auto">
          <TabsList>
            <TabsTrigger value="stock">Stock</TabsTrigger>
            <TabsTrigger value="purchasing">Purchasing</TabsTrigger>
            <TabsTrigger value="menu">Menu &amp; Recipes</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="stock">
          <StockTab
            ingredientList={ingredientList}
            transactionList={transactionList}
            itemComponentList={itemComponentList}
            recipeComponentList={recipeComponentList}
            range={range}
          />
        </TabsContent>

        <TabsContent value="purchasing">
          <PurchasingTab
            ingredientList={ingredientList}
            transactionList={transactionList}
            countList={countList}
          />
        </TabsContent>

        <TabsContent value="menu">
          <MenuTabContent />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsTab
            ingredientList={ingredientList}
            transactionList={transactionList}
            countList={countList}
            costMap={costMap}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
