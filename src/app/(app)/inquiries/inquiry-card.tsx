"use client";

import { ChevronRightIcon, MailIcon, PhoneIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Inquiry } from "@/lib/types";
import { INQUIRY_TYPE_LABELS } from "@/lib/types";
import { InquiryStatusSelect } from "./status-select";
import { deleteInquiry } from "./actions";
import { inquiryBadge } from "./inquiry-badge";

// Dates are formatted on the server and passed in so the card matches the table.
export function InquiryCard({
  inquiry,
  received,
  eventDate,
  eventTime,
  pending,
  onSetRead,
}: {
  inquiry: Inquiry;
  received: string;
  eventDate: string | null;
  eventTime: string | null;
  pending: boolean;
  onSetRead: (isRead: boolean) => void;
}) {
  const badge = inquiryBadge(inquiry);

  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl border bg-card p-4 text-left active:bg-muted/50"
          />
        }
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-medium">{inquiry.name}</span>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <Badge variant="outline">{INQUIRY_TYPE_LABELS[inquiry.inquiry_type]}</Badge>
            <span>{eventDate ? `Event ${eventDate}` : `Received ${received}`}</span>
          </div>
        </div>
        <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="pr-8">{inquiry.name}</DialogTitle>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{INQUIRY_TYPE_LABELS[inquiry.inquiry_type]}</Badge>
            <Badge variant={badge.variant}>{badge.label}</Badge>
            <span>Received {received}</span>
          </div>
        </DialogHeader>

        {inquiry.email || inquiry.phone ? (
          <div className="flex flex-col gap-2">
            {inquiry.phone ? (
              <Button
                variant="outline"
                className="justify-start"
                nativeButton={false}
                render={<a href={`tel:${inquiry.phone}`} />}
              >
                <PhoneIcon />
                {inquiry.phone}
              </Button>
            ) : null}
            {inquiry.email ? (
              <Button
                variant="outline"
                className="justify-start"
                nativeButton={false}
                render={<a href={`mailto:${inquiry.email}`} />}
              >
                <MailIcon />
                <span className="truncate">{inquiry.email}</span>
              </Button>
            ) : null}
          </div>
        ) : null}

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
          <dt className="text-muted-foreground">Event date</dt>
          <dd>{eventDate ?? "—"}</dd>
          <dt className="text-muted-foreground">Time</dt>
          <dd>{eventTime ?? "—"}</dd>
          <dt className="text-muted-foreground">Location</dt>
          <dd className="break-words">{inquiry.event_location ?? "—"}</dd>
          <dt className="text-muted-foreground">Guests</dt>
          <dd>{inquiry.guest_count ?? "—"}</dd>
        </dl>

        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground">Message</span>
          <p className="whitespace-pre-wrap break-words">{inquiry.message ?? "—"}</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
          <InquiryStatusSelect key={inquiry.status} id={inquiry.id} status={inquiry.status} />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => onSetRead(!inquiry.is_read)}
            >
              {inquiry.is_read ? "Mark unread" : "Mark read"}
            </Button>
            <form action={deleteInquiry}>
              <input type="hidden" name="id" value={inquiry.id} />
              <Button variant="ghost" size="sm" type="submit" className="text-destructive">
                Delete
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
