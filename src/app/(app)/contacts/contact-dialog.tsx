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
import { CONTACT_TYPE_LABELS, type Contact } from "@/lib/types";
import { createContact, updateContact } from "./actions";

export function ContactDialog({ contact }: { contact?: Contact }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const isEdit = !!contact;
  const action = isEdit ? updateContact : createContact;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant={isEdit ? "ghost" : "default"} size="sm">
            {isEdit ? "Edit" : "Add contact"}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit contact" : "Add contact"}</DialogTitle>
        </DialogHeader>
        <form
          ref={formRef}
          action={async (formData) => {
            await action(formData);
            formRef.current?.reset();
            setOpen(false);
          }}
          className="flex flex-col gap-4"
        >
          {isEdit ? <input type="hidden" name="id" value={contact.id} /> : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="contact-name">Name</Label>
              <Input
                id="contact-name"
                name="name"
                required
                defaultValue={contact?.name ?? ""}
                placeholder="Jamie Rivera"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="contact-business">Business / venue / event</Label>
              <Input
                id="contact-business"
                name="business_name"
                defaultValue={contact?.business_name ?? ""}
                placeholder="Riverside Farmers Market"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-type">Type</Label>
            <Select
              name="contact_type"
              items={CONTACT_TYPE_LABELS}
              defaultValue={contact?.contact_type ?? "other"}
            >
              <SelectTrigger id="contact-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CONTACT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                name="email"
                type="email"
                defaultValue={contact?.email ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="contact-phone">Phone</Label>
              <Input
                id="contact-phone"
                name="phone"
                type="tel"
                defaultValue={contact?.phone ?? ""}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-social">Social</Label>
            <Input
              id="contact-social"
              name="social_handle"
              defaultValue={contact?.social_handle ?? ""}
              placeholder="@handle or profile URL"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-notes">Notes</Label>
            <Textarea
              id="contact-notes"
              name="notes"
              rows={2}
              defaultValue={contact?.notes ?? ""}
            />
          </div>

          <Button type="submit">{isEdit ? "Save contact" : "Add contact"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
