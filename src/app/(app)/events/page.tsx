import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Contact, Event } from "@/lib/types";
import { EVENT_TYPE_LABELS } from "@/lib/types";
import { formatDateRange } from "@/lib/event-days";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AddEventDialog } from "./add-event-dialog";

const STATUS_VARIANT: Record<Event["status"], "default" | "secondary" | "outline"> = {
  planned: "outline",
  completed: "default",
  cancelled: "secondary",
};

export default async function EventsPage() {
  const supabase = await createClient();
  const [{ data: events }, { data: contacts }] = await Promise.all([
    supabase.from("events").select("*").order("event_date", { ascending: false }),
    supabase.from("contacts").select("*").order("name", { ascending: true }),
  ]);

  const eventList = (events ?? []) as Event[];
  const contactList = (contacts ?? []) as Contact[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Events</h1>
          <p className="text-sm text-muted-foreground">
            Every festival, catering gig, and market you've worked or booked.
          </p>
        </div>
        <AddEventDialog contacts={contactList} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {eventList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No events yet. Add your first event to start logging sales.
              </TableCell>
            </TableRow>
          ) : (
            eventList.map((event) => (
              <TableRow key={event.id} className="cursor-pointer">
                <TableCell>
                  <Link href={`/events/${event.id}`} className="block">
                    {formatDateRange(event.event_date, event.end_date)}
                  </Link>
                </TableCell>
                <TableCell className="font-medium">
                  <Link href={`/events/${event.id}`} className="block">
                    {event.name}
                  </Link>
                </TableCell>
                <TableCell>{EVENT_TYPE_LABELS[event.event_type]}</TableCell>
                <TableCell>{event.location ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[event.status]}>
                    {event.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
