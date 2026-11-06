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
import { logMetrics } from "./actions";

export function LogMetricsDialog({ postId }: { postId: string }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm">Log metrics</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log engagement</DialogTitle>
        </DialogHeader>
        <form
          ref={formRef}
          action={async (formData) => {
            await logMetrics(formData);
            formRef.current?.reset();
            setOpen(false);
          }}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="post_id" value={postId} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="metrics-date">Date</Label>
            <Input
              id="metrics-date"
              name="recorded_date"
              type="date"
              defaultValue={today}
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="metrics-likes">Likes</Label>
              <Input id="metrics-likes" name="likes" type="number" min="0" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="metrics-comments">Comments</Label>
              <Input id="metrics-comments" name="comments" type="number" min="0" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="metrics-shares">Shares</Label>
              <Input id="metrics-shares" name="shares" type="number" min="0" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="metrics-saves">Saves</Label>
              <Input id="metrics-saves" name="saves" type="number" min="0" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="metrics-views">Views</Label>
              <Input id="metrics-views" name="views" type="number" min="0" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="metrics-reach">Reach</Label>
              <Input id="metrics-reach" name="reach" type="number" min="0" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="metrics-followers">Follower count (optional)</Label>
            <Input
              id="metrics-followers"
              name="follower_count_snapshot"
              type="number"
              min="0"
            />
          </div>
          <Button type="submit">Save metrics</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
