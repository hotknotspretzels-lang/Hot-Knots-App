import { createClient } from "@/lib/supabase/server";
import type { Inquiry } from "@/lib/types";
import { INQUIRY_TYPE_LABELS } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InquiryStatusSelect } from "./status-select";
import { deleteInquiry } from "./actions";
import { InquiryCard } from "./inquiry-card";

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

  const inquiryList = (inquiries ?? []) as Inquiry[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Inquiries</h1>
        <p className="text-sm text-muted-foreground">
          Catering and event inquiries submitted from the public website.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {inquiryList.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            No inquiries yet. Submissions from the public website will show up here.
          </p>
        ) : (
          inquiryList.map((inquiry) => (
            <InquiryCard
              key={inquiry.id}
              inquiry={inquiry}
              received={new Date(inquiry.created_at).toLocaleDateString()}
              eventDate={
                inquiry.event_date
                  ? new Date(inquiry.event_date + "T00:00:00").toLocaleDateString()
                  : null
              }
              eventTime={
                inquiry.event_start_time
                  ? formatTime(inquiry.event_start_time) +
                    (inquiry.event_end_time ? ` – ${formatTime(inquiry.event_end_time)}` : "")
                  : null
              }
            />
          ))
        )}
      </div>

      <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Received</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Event date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Guests</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {inquiryList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="text-center text-muted-foreground">
                No inquiries yet. Submissions from the public website will show up here.
              </TableCell>
            </TableRow>
          ) : (
            inquiryList.map((inquiry) => (
              <TableRow key={inquiry.id}>
                <TableCell className="text-muted-foreground">
                  {new Date(inquiry.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{INQUIRY_TYPE_LABELS[inquiry.inquiry_type]}</Badge>
                </TableCell>
                <TableCell className="font-medium">{inquiry.name}</TableCell>
                <TableCell>
                  <div className="flex flex-col text-sm">
                    <span>{inquiry.email ?? "—"}</span>
                    {inquiry.phone ? (
                      <span className="text-muted-foreground">{inquiry.phone}</span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  {inquiry.event_date
                    ? new Date(inquiry.event_date + "T00:00:00").toLocaleDateString()
                    : "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatTime(inquiry.event_start_time) ?? "—"}
                  {inquiry.event_end_time
                    ? ` – ${formatTime(inquiry.event_end_time)}`
                    : ""}
                </TableCell>
                <TableCell
                  className="max-w-[12rem] truncate text-sm"
                  title={inquiry.event_location ?? ""}
                >
                  {inquiry.event_location ?? "—"}
                </TableCell>
                <TableCell>{inquiry.guest_count ?? "—"}</TableCell>
                <TableCell className="max-w-xs truncate" title={inquiry.message ?? ""}>
                  {inquiry.message ?? "—"}
                </TableCell>
                <TableCell>
                  <InquiryStatusSelect key={inquiry.status} id={inquiry.id} status={inquiry.status} />
                </TableCell>
                <TableCell>
                  <form action={deleteInquiry}>
                    <input type="hidden" name="id" value={inquiry.id} />
                    <Button variant="ghost" size="sm" type="submit">
                      Delete
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
