import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { normalizeChecklist } from "@/lib/checklists";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChecklistProgress } from "./checklist-progress";
import { CreateChecklistDialog } from "./create-checklist-dialog";
import { DeleteChecklistDialog } from "./delete-checklist-dialog";

export default async function ChecklistsPage() {
  const supabase = await createClient();
  const [{ data: checklists, error }, { data: items, error: itemsError }] = await Promise.all([
    supabase
      .from("checklists")
      .select("id, name, base_customer_count, expected_customer_count, sort_order, created_at")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.from("checklist_items").select("checklist_id, is_checked"),
  ]);

  const loadError = error ?? itemsError;
  const list = (checklists ?? []).map((row) => normalizeChecklist(row));
  const counts = new Map<string, { total: number; done: number }>();
  for (const item of items ?? []) {
    const current = counts.get(item.checklist_id) ?? { total: 0, done: 0 };
    current.total += 1;
    if (item.is_checked) current.done += 1;
    counts.set(item.checklist_id, current);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Checklists</h1>
          <p className="text-sm text-muted-foreground">
            Load-out, opening, closing, and prep. Check items off on site, then reset the list for
            the next event.
          </p>
        </div>
        <CreateChecklistDialog />
      </div>

      {loadError ? (
        <p role="alert" className="text-sm text-destructive">
          {loadError.message} If this is a missing table, apply
          supabase/migrations/0018_checklists.sql, then reload.
        </p>
      ) : list.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No checklists yet. Add one for event load-out, opening, closing, or prep.
        </p>
      ) : (
        <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((checklist) => {
            const progress = counts.get(checklist.id) ?? { total: 0, done: 0 };
            const headcount =
              checklist.expected_customer_count != null &&
              checklist.expected_customer_count !== checklist.base_customer_count
                ? `Scaled to ${checklist.expected_customer_count.toLocaleString("en-US")} customers`
                : `Written for ${checklist.base_customer_count.toLocaleString("en-US")} customers`;

            return (
              <Card key={checklist.id}>
                <CardHeader>
                  <CardTitle>{checklist.name}</CardTitle>
                  <CardDescription>{headcount}</CardDescription>
                  <CardAction>
                    <DeleteChecklistDialog
                      id={checklist.id}
                      name={checklist.name}
                      itemCount={progress.total}
                    />
                  </CardAction>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <ChecklistProgress done={progress.done} total={progress.total} />
                  <div className="grid grid-cols-2 gap-2">
                    <Button nativeButton={false} render={<Link href={`/checklists/${checklist.id}`} />}>
                      Run
                    </Button>
                    <Button
                      variant="outline"
                      nativeButton={false}
                      render={<Link href={`/checklists/${checklist.id}?mode=edit`} />}
                    >
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
