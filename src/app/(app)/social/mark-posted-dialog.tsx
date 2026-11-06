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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SOCIAL_POST_TYPE_LABELS } from "@/lib/types";
import { markPosted } from "./actions";

export function MarkPostedDialog({
  strategyId,
  contentIdea,
}: {
  strategyId: string;
  contentIdea: string;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm">Mark posted</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark posted</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground line-clamp-2">{contentIdea}</p>
        <form
          ref={formRef}
          action={async (formData) => {
            await markPosted(formData);
            formRef.current?.reset();
            setOpen(false);
          }}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="id" value={strategyId} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="posted-type">Post type</Label>
            <Select name="post_type" items={SOCIAL_POST_TYPE_LABELS} defaultValue="photo">
              <SelectTrigger id="posted-type" className="w-full">
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
          <div className="flex flex-col gap-2">
            <Label htmlFor="posted-permalink">Link (optional)</Label>
            <Input id="posted-permalink" name="permalink" placeholder="https://..." />
          </div>
          <Button type="submit">Save</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
