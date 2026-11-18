import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Checklist, ChecklistItem } from "@/lib/types";
import { ChecklistDetail } from "./checklist-detail";

export default async function ChecklistPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { id } = await params;
  const { mode } = await searchParams;
  const supabase = await createClient();

  const [{ data: checklist, error }, { data: items, error: itemsError }] = await Promise.all([
    supabase
      .from("checklists")
      .select("id, name, sort_order, created_at")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("checklist_items")
      .select("id, checklist_id, title, is_checked, checked_at, sort_order, created_at")
      .eq("checklist_id", id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  const loadError = error ?? itemsError;
  if (loadError) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {loadError.message} If this is a missing table, apply supabase/migrations/0018_checklists.sql,
        then reload.
      </p>
    );
  }
  if (!checklist) notFound();

  return (
    <ChecklistDetail
      checklist={checklist as Checklist}
      items={(items ?? []) as ChecklistItem[]}
      initialMode={mode === "edit" ? "edit" : "run"}
    />
  );
}
