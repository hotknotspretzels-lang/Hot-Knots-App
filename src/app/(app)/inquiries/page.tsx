import { createClient } from "@/lib/supabase/server";
import type { Inquiry } from "@/lib/types";
import { InquiriesView, type InquiryListItem } from "./inquiries-view";

function formatTime(time: string | null): string | null {
  if (!time) return null;
  const [hours, minutes] = time.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes));
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default async function InquiriesPage() {
  const supabase = await createClient();

  const { data: inquiries } = await supabase
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false });

  const items: InquiryListItem[] = ((inquiries ?? []) as Inquiry[]).map((row) => {
    const inquiry: Inquiry = { ...row, is_read: row.is_read === true };
    const eventTime = inquiry.event_start_time
      ? formatTime(inquiry.event_start_time) +
        (inquiry.event_end_time ? ` – ${formatTime(inquiry.event_end_time)}` : "")
      : null;
    return {
      inquiry,
      received: new Date(inquiry.created_at).toLocaleDateString(),
      eventDate: inquiry.event_date
        ? new Date(inquiry.event_date + "T00:00:00").toLocaleDateString()
        : null,
      eventTime,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Inquiries</h1>
        <p className="text-sm text-muted-foreground">
          Catering and event inquiries from the public website. This list starts
          on unread inquiries. Mark them read to clear spam, then open Read to
          mark any of them unread again.
        </p>
      </div>
      <InquiriesView items={items} />
    </div>
  );
}
