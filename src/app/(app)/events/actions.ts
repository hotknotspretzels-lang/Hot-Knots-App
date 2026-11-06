"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { EventStatus, EventType } from "@/lib/types";

function optionalNumber(formData: FormData, key: string): number | null {
  const raw = formData.get(key);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
}

function optionalText(formData: FormData, key: string): string | null {
  const raw = String(formData.get(key) ?? "").trim();
  return raw || null;
}

type DayInput = {
  day_date: string;
  start_time: string | null;
  end_time: string | null;
};

// Reads the index-aligned day_date / day_start / day_end fields, sorted by
// date with duplicate dates dropped.
function parseDays(formData: FormData): DayInput[] {
  const dates = formData.getAll("day_date").map(String);
  const starts = formData.getAll("day_start").map(String);
  const ends = formData.getAll("day_end").map(String);

  const byDate = new Map<string, DayInput>();
  dates.forEach((date, i) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || byDate.has(date)) return;
    byDate.set(date, {
      day_date: date,
      start_time: starts[i] || null,
      end_time: ends[i] || null,
    });
  });
  return [...byDate.values()].sort((a, b) =>
    a.day_date.localeCompare(b.day_date),
  );
}

export async function createEvent(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const days = parseDays(formData);
  const eventType = String(formData.get("event_type") ?? "") as EventType;
  if (!name || days.length === 0 || !eventType) return;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .insert({
      name,
      event_date: days[0].day_date,
      event_time: days[0].start_time,
      end_date: days[days.length - 1].day_date,
      event_type: eventType,
      location: optionalText(formData, "location"),
      expected_attendance: optionalNumber(formData, "expected_attendance"),
      booth_fee: optionalNumber(formData, "booth_fee"),
      booth_fee_percent: optionalNumber(formData, "booth_fee_percent"),
      notes: optionalText(formData, "notes"),
      is_public: formData.get("is_public") === "on",
      contact_id: optionalText(formData, "contact_id"),
    })
    .select("id")
    .single();

  if (!error && data) {
    await supabase.from("event_days").upsert(
      days.map((d) => ({ ...d, event_id: data.id })),
      { onConflict: "event_id,day_date" },
    );
  }

  revalidatePath("/events");
  revalidatePath("/calendar");
  if (!error && data) {
    redirect(`/events/${data.id}`);
  }
}

export async function updateEventSchedule(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const days = parseDays(formData);
  if (!id || days.length === 0) return;

  const supabase = await createClient();
  const { error } = await supabase.from("event_days").upsert(
    days.map((d) => ({ ...d, event_id: id })),
    { onConflict: "event_id,day_date" },
  );
  if (error) return;

  await supabase
    .from("event_days")
    .delete()
    .eq("event_id", id)
    .not("day_date", "in", `(${days.map((d) => d.day_date).join(",")})`);
  await supabase
    .from("events")
    .update({
      event_date: days[0].day_date,
      event_time: days[0].start_time,
      end_date: days[days.length - 1].day_date,
    })
    .eq("id", id);

  revalidatePath(`/events/${id}`);
  revalidatePath("/events");
  revalidatePath("/calendar");
}

export async function updateEventDetails(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("events")
    .update({
      expected_attendance: optionalNumber(formData, "expected_attendance"),
      actual_attendance: optionalNumber(formData, "actual_attendance"),
      weather_condition:
        String(formData.get("weather_condition") ?? "").trim() || null,
      temperature_high: optionalNumber(formData, "temperature_high"),
      booth_fee: optionalNumber(formData, "booth_fee"),
      booth_fee_percent: optionalNumber(formData, "booth_fee_percent"),
      status: String(formData.get("status") ?? "planned") as EventStatus,
      notes: String(formData.get("notes") ?? "").trim() || null,
      is_public: formData.get("is_public") === "on",
    })
    .eq("id", id);

  revalidatePath(`/events/${id}`);
  revalidatePath("/events");
  revalidatePath("/calendar");
}

export async function deleteEvent(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("events").delete().eq("id", id);

  revalidatePath("/events");
  revalidatePath("/");
  revalidatePath("/inventory");
  revalidatePath("/costs");
  redirect("/events");
}
