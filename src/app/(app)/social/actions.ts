"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SocialPlatform, SocialPostType, SocialStrategyStatus } from "@/lib/types";

function optionalText(formData: FormData, key: string): string | null {
  const raw = String(formData.get(key) ?? "").trim();
  return raw || null;
}

function optionalNumber(formData: FormData, key: string): number | null {
  const raw = formData.get(key);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
}

export async function createStrategyItem(formData: FormData) {
  const plannedDate = String(formData.get("planned_date") ?? "");
  const platform = String(formData.get("platform") ?? "") as SocialPlatform;
  const contentIdea = String(formData.get("content_idea") ?? "").trim();
  if (!plannedDate || !platform || !contentIdea) return;

  const supabase = await createClient();
  await supabase.from("social_strategy_plan").insert({
    planned_date: plannedDate,
    platform,
    content_idea: contentIdea,
    linked_event_id: optionalText(formData, "linked_event_id"),
    notes: optionalText(formData, "notes"),
  });

  revalidatePath("/social");
  revalidatePath("/calendar");
}

export async function updateStrategyStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as SocialStrategyStatus;
  if (!id || !status) return;

  const supabase = await createClient();
  await supabase.from("social_strategy_plan").update({ status }).eq("id", id);

  revalidatePath("/social");
}

export async function deleteStrategyItem(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("social_strategy_plan").delete().eq("id", id);

  revalidatePath("/social");
  revalidatePath("/calendar");
}

export async function markPosted(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const postType = String(formData.get("post_type") ?? "photo") as SocialPostType;
  const permalink = optionalText(formData, "permalink");
  if (!id) return;

  const supabase = await createClient();
  const { data: item } = await supabase
    .from("social_strategy_plan")
    .select("*")
    .eq("id", id)
    .single();
  if (!item) return;

  await supabase.from("social_posts").insert({
    platform: item.platform,
    post_date: new Date().toISOString().slice(0, 10),
    post_type: postType,
    caption_summary: item.content_idea,
    permalink,
    linked_event_id: item.linked_event_id,
  });

  await supabase
    .from("social_strategy_plan")
    .update({ status: "posted" })
    .eq("id", id);

  revalidatePath("/social");
  revalidatePath("/calendar");
}

export async function createPost(formData: FormData) {
  const platform = String(formData.get("platform") ?? "") as SocialPlatform;
  const postDate = String(formData.get("post_date") ?? "");
  const postType = String(formData.get("post_type") ?? "photo") as SocialPostType;
  if (!platform || !postDate) return;

  const supabase = await createClient();
  await supabase.from("social_posts").insert({
    platform,
    post_date: postDate,
    post_type: postType,
    caption_summary: optionalText(formData, "caption_summary"),
    permalink: optionalText(formData, "permalink"),
    linked_event_id: optionalText(formData, "linked_event_id"),
  });

  revalidatePath("/social");
}

export async function deletePost(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("social_posts").delete().eq("id", id);

  revalidatePath("/social");
}

export async function logMetrics(formData: FormData) {
  const postId = String(formData.get("post_id") ?? "");
  const recordedDate = String(formData.get("recorded_date") ?? "");
  if (!postId || !recordedDate) return;

  const supabase = await createClient();
  await supabase.from("social_metrics").insert({
    post_id: postId,
    recorded_date: recordedDate,
    likes: optionalNumber(formData, "likes"),
    comments: optionalNumber(formData, "comments"),
    shares: optionalNumber(formData, "shares"),
    saves: optionalNumber(formData, "saves"),
    views: optionalNumber(formData, "views"),
    reach: optionalNumber(formData, "reach"),
    follower_count_snapshot: optionalNumber(formData, "follower_count_snapshot"),
  });

  revalidatePath("/social");
}
