"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Inquiry } from "@/lib/types";
import { INQUIRY_TYPE_LABELS } from "@/lib/types";
import { setInquiriesRead, deleteInquiry } from "./actions";
import { inquiryBadge } from "./inquiry-badge";
import { InquiryCard } from "./inquiry-card";
import { InquiryStatusSelect } from "./status-select";

export type InquiryListItem = {
  inquiry: Inquiry;
  received: string;
  eventDate: string | null;
  eventTime: string | null;
};

export function InquiriesView({ items }: { items: InquiryListItem[] }) {
  const [showRead, setShowRead] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const unreadCount = items.filter((item) => !item.inquiry.is_read).length;
  const readCount = items.length - unreadCount;
  const visible = items.filter((item) => item.inquiry.is_read === showRead);
  const visibleIds = visible.map((item) => item.inquiry.id);
  const selectedVisible = visibleIds.filter((id) => selected.has(id));
  const allSelected = visibleIds.length > 0 && selectedVisible.length === visibleIds.length;
  const someSelected = selectedVisible.length > 0 && !allSelected;

  function toggleOne(id: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(visibleIds) : new Set());
  }

  function changeView(next: boolean) {
    setShowRead(next);
    setSelected(new Set());
    setError(null);
  }

  function applyRead(ids: string[], isRead: boolean) {
    startTransition(async () => {
      const message = await setInquiriesRead(ids, isRead);
      setError(message);
      if (!message) setSelected(new Set());
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={showRead ? "outline" : "default"}
            onClick={() => changeView(false)}
          >
            Unread ({unreadCount})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={showRead ? "default" : "outline"}
            onClick={() => changeView(true)}
          >
            Read ({readCount})
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            disabled={pending || selectedVisible.length === 0}
            onClick={() => applyRead(selectedVisible, !showRead)}
          >
            {showRead ? "Mark unread" : "Mark read"}
            {selectedVisible.length > 0 ? ` (${selectedVisible.length})` : ""}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending || visibleIds.length === 0}
            onClick={() => applyRead(visibleIds, !showRead)}
          >
            {showRead ? "Mark all unread" : "Mark all read"}
          </Button>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 md:hidden">
        {visible.length === 0 ? (
          <EmptyMessage showRead={showRead} hasAny={items.length > 0} />
        ) : (
          visible.map((item) => (
            <div key={item.inquiry.id} className="flex items-start gap-3">
              <Checkbox
                className="mt-5"
                checked={selected.has(item.inquiry.id)}
                onCheckedChange={(checked) => toggleOne(item.inquiry.id, checked)}
                aria-label={`Select ${item.inquiry.name}`}
              />
              <div className="min-w-0 flex-1">
                <InquiryCard
                  inquiry={item.inquiry}
                  received={item.received}
                  eventDate={item.eventDate}
                  eventTime={item.eventTime}
                  pending={pending}
                  onSetRead={(isRead) => applyRead([item.inquiry.id], isRead)}
                />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  disabled={visibleIds.length === 0}
                  onCheckedChange={toggleAll}
                  aria-label={showRead ? "Select all read inquiries" : "Select all unread inquiries"}
                />
              </TableHead>
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
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center text-muted-foreground">
                  <EmptyMessage showRead={showRead} hasAny={items.length > 0} />
                </TableCell>
              </TableRow>
            ) : (
              visible.map((item) => {
                const { inquiry } = item;
                const badge = inquiryBadge(inquiry);
                return (
                  <TableRow key={inquiry.id}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(inquiry.id)}
                        onCheckedChange={(checked) => toggleOne(inquiry.id, checked)}
                        aria-label={`Select ${inquiry.name}`}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.received}</TableCell>
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
                    <TableCell>{item.eventDate ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.eventTime ?? "—"}
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
                      <div className="flex items-center gap-2">
                        {inquiry.is_read ? <Badge variant={badge.variant}>{badge.label}</Badge> : null}
                        <InquiryStatusSelect
                          key={inquiry.status}
                          id={inquiry.id}
                          status={inquiry.status}
                        />
                      </div>
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
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function EmptyMessage({ showRead, hasAny }: { showRead: boolean; hasAny: boolean }) {
  if (!hasAny) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        No inquiries yet. Submissions from the public website will show up here.
      </p>
    );
  }
  return (
    <p className="text-center text-sm text-muted-foreground">
      {showRead ? "No read inquiries." : "No unread inquiries."}
    </p>
  );
}
