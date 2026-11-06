"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SOCIAL_PLATFORM_LABELS, SOCIAL_POST_TYPE_LABELS, type Event } from "@/lib/types";
import { createPost } from "./actions";

export function PostDialog({ events }: { events: Event[] }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const today = new Date().toISOString().slice(0, 10);

  const eventItems = Object.fromEntries(
    events.map((e) => [
      e.id,
      `${e.name} (${new Date(e.event_date + "T00:00:00").toLocaleDateString()})`,
    ]),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm">Add post</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add post</DialogTitle>
        </DialogHeader>
        <form
          ref={formRef}
          action={async (formData) => {
            await createPost(formData);
            formRef.current?.reset();
            setOpen(false);
          }}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="post-date">Date</Label>
              <Input
                id="post-date"
                name="post_date"
                type="date"
                defaultValue={today}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="post-platform">Platform</Label>
              <Select
                name="platform"
                items={SOCIAL_PLATFORM_LABELS}
                defaultValue="instagram"
                required
              >
                <SelectTrigger id="post-platform" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SOCIAL_PLATFORM_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="post-type">Type</Label>
              <Select name="post_type" items={SOCIAL_POST_TYPE_LABELS} defaultValue="photo">
                <SelectTrigger id="post-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SOCIAL_POST_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="post-caption">Caption summary</Label>
            <Textarea id="post-caption" name="caption_summary" rows={2} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="post-permalink">Link</Label>
            <Input id="post-permalink" name="permalink" placeholder="https://..." />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="post-event">Linked event (optional)</Label>
            <Select name="linked_event_id" items={eventItems}>
              <SelectTrigger id="post-event" className="w-full">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                {events.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name} ({new Date(e.event_date + "T00:00:00").toLocaleDateString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit">Add post</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
