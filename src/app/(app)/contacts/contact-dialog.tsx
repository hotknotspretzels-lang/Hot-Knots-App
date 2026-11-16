"use client";

import { useRef, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  CONTACT_METHOD_LABELS,
  CONTACT_STATUS_LABELS,
  CONTACT_TYPE_LABELS,
  type Contact,
} from "@/lib/types";
import { createContact, updateContact } from "./actions";

const STATUS_ITEMS = { unset: "Not set", ...CONTACT_STATUS_LABELS };
const METHOD_ITEMS = { unset: "Not set", ...CONTACT_METHOD_LABELS };

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

export function ContactDialog({ contact }: { contact?: Contact }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const isEdit = !!contact;
  const save = isEdit ? updateContact : createContact;
  const prefix = contact?.id ?? "new";
  const fieldId = (name: string) => `${prefix}-${name}`;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger
        render={
          <Button variant={isEdit ? "ghost" : "default"} size="sm">
            {isEdit ? "Edit" : "Add contact"}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit contact" : "Add contact"}</DialogTitle>
          <DialogDescription>
            Who they are, how to reach them, and where the booking stands.
          </DialogDescription>
        </DialogHeader>
        <form
          action={async (formData) => {
            if (pendingRef.current) return;
            pendingRef.current = true;
            setPending(true);
            setError(null);
            const message = await save(formData);
            pendingRef.current = false;
            setPending(false);
            if (message) {
              setError(message);
              return;
            }
            setOpen(false);
          }}
          className="flex flex-col gap-5"
        >
          {isEdit ? <input type="hidden" name="id" value={contact.id} /> : null}

          <fieldset className="flex flex-col gap-4">
            <legend className="text-sm font-medium">Person</legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id={fieldId("name")} label="Name">
                <Input
                  id={fieldId("name")}
                  name="name"
                  required
                  autoComplete="name"
                  defaultValue={contact?.name ?? ""}
                  placeholder="Jamie Rivera"
                />
              </Field>
              <Field id={fieldId("title")} label="Title / role">
                <Input
                  id={fieldId("title")}
                  name="title"
                  autoComplete="organization-title"
                  defaultValue={contact?.title ?? ""}
                  placeholder="Events director"
                />
              </Field>
              <Field id={fieldId("business")} label="Organization">
                <Input
                  id={fieldId("business")}
                  name="business_name"
                  autoComplete="organization"
                  defaultValue={contact?.business_name ?? ""}
                  placeholder="Riverside Farmers Market"
                />
              </Field>
              <Field id={fieldId("type")} label="Type">
                <Select
                  name="contact_type"
                  items={CONTACT_TYPE_LABELS}
                  defaultValue={contact?.contact_type ?? "other"}
                >
                  <SelectTrigger id={fieldId("type")} className="w-full">
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
              </Field>
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-4">
            <legend className="text-sm font-medium">Reach</legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id={fieldId("email")} label="Email">
                <Input
                  id={fieldId("email")}
                  name="email"
                  type="email"
                  autoComplete="email"
                  defaultValue={contact?.email ?? ""}
                />
              </Field>
              <Field id={fieldId("phone")} label="Phone">
                <Input
                  id={fieldId("phone")}
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  defaultValue={contact?.phone ?? ""}
                />
              </Field>
              <Field id={fieldId("secondary-email")} label="Secondary email">
                <Input
                  id={fieldId("secondary-email")}
                  name="secondary_email"
                  type="email"
                  defaultValue={contact?.secondary_email ?? ""}
                />
              </Field>
              <Field id={fieldId("secondary-phone")} label="Secondary phone">
                <Input
                  id={fieldId("secondary-phone")}
                  name="secondary_phone"
                  type="tel"
                  defaultValue={contact?.secondary_phone ?? ""}
                />
              </Field>
              <Field id={fieldId("method")} label="Preferred contact method">
                <Select
                  name="preferred_contact_method"
                  items={METHOD_ITEMS}
                  defaultValue={contact?.preferred_contact_method ?? "unset"}
                >
                  <SelectTrigger id={fieldId("method")} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unset">Not set</SelectItem>
                    {Object.entries(CONTACT_METHOD_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field id={fieldId("website")} label="Website">
                <Input
                  id={fieldId("website")}
                  name="website"
                  defaultValue={contact?.website ?? ""}
                  placeholder="https://example.com"
                />
              </Field>
              <Field id={fieldId("social")} label="Social">
                <Input
                  id={fieldId("social")}
                  name="social_handle"
                  defaultValue={contact?.social_handle ?? ""}
                  placeholder="@handle or profile URL"
                />
              </Field>
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-4">
            <legend className="text-sm font-medium">Booking</legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id={fieldId("status")} label="Status">
                <Select
                  name="status"
                  items={STATUS_ITEMS}
                  defaultValue={contact?.status ?? (isEdit ? "unset" : "prospect")}
                >
                  <SelectTrigger id={fieldId("status")} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unset">Not set</SelectItem>
                    {Object.entries(CONTACT_STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field id={fieldId("related")} label="Related event or opportunity">
                <Input
                  id={fieldId("related")}
                  name="related_event"
                  defaultValue={contact?.related_event ?? ""}
                  placeholder="Sounds of Summer 2027"
                />
              </Field>
              <Field id={fieldId("last")} label="Last contacted">
                <Input
                  id={fieldId("last")}
                  name="last_contacted_on"
                  type="date"
                  defaultValue={contact?.last_contacted_on?.slice(0, 10) ?? ""}
                />
              </Field>
              <Field id={fieldId("next")} label="Next follow-up">
                <Input
                  id={fieldId("next")}
                  name="next_follow_up_on"
                  type="date"
                  defaultValue={contact?.next_follow_up_on?.slice(0, 10) ?? ""}
                />
              </Field>
              <Field id={fieldId("location")} label="Address / location">
                <Input
                  id={fieldId("location")}
                  name="location"
                  defaultValue={contact?.location ?? ""}
                  placeholder="Campus quad, or a street address"
                />
              </Field>
              <Field id={fieldId("source")} label="Source">
                <Input
                  id={fieldId("source")}
                  name="source"
                  defaultValue={contact?.source ?? ""}
                  placeholder="Where you found them, URL ok"
                />
              </Field>
            </div>
          </fieldset>

          <Field id={fieldId("notes")} label="Notes">
            <Textarea
              id={fieldId("notes")}
              name="notes"
              rows={3}
              defaultValue={contact?.notes ?? ""}
            />
          </Field>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <DialogFooter className="bg-popover sm:justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save contact" : "Add contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
