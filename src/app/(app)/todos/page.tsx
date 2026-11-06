import { createClient } from "@/lib/supabase/server";
import type { TodoCategory, TodoItem } from "@/lib/types";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddCategoryDialog } from "./add-category-dialog";
import { AddItemForm } from "./add-item-form";
import { DeleteCategoryButton } from "./delete-category-button";
import { TodoItemRow } from "./todo-item-row";

export default async function TodosPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase
      .from("todo_categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("todo_items")
      .select("*")
      .eq("is_done", false)
      .order("created_at", { ascending: true }),
  ]);
  const categoryList = (categories ?? []) as TodoCategory[];
  const itemList = (items ?? []) as TodoItem[];

  const itemsByCategory = new Map<string, TodoItem[]>();
  for (const item of itemList) {
    const list = itemsByCategory.get(item.category_id) ?? [];
    list.push(item);
    itemsByCategory.set(item.category_id, list);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">To-Do</h1>
          <p className="text-sm text-muted-foreground">
            Check things off and they disappear.
          </p>
        </div>
        <AddCategoryDialog />
      </div>

      {categoryList.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No categories yet. Add your first one to get started.
        </p>
      ) : (
        <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categoryList.map((category) => {
            const categoryItems = itemsByCategory.get(category.id) ?? [];
            return (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle>{category.name}</CardTitle>
                  <CardAction>
                    <DeleteCategoryButton
                      id={category.id}
                      name={category.name}
                      openCount={categoryItems.length}
                    />
                  </CardAction>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {categoryItems.length === 0 ? (
                    <p className="px-2 text-muted-foreground">Nothing to do.</p>
                  ) : (
                    <div className="flex flex-col">
                      {categoryItems.map((item) => (
                        <TodoItemRow key={item.id} item={item} />
                      ))}
                    </div>
                  )}
                  <AddItemForm categoryId={category.id} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
