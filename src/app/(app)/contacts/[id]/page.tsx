import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Contact } from "@/lib/types";
import { CONTACT_TYPE_LABELS } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ContactDialog } from "../contact-dialog";
import { ContactStatusBadge } from "../contact-status-badge";
import { deleteContact } from "../actions";
import {
  contactMethodLabel,
  externalHref,
  followUpPresentation,
  formatContactDate,
  normalizeContact,
} from "../contact-format";

function TextValue({ value }: { value: string | null }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  return <span className="whitespace-pre-wrap">{value}</span>;
}

function DetailItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

function MailValue({ value }: { value: string | null }) {
  if (!value) return <TextValue value={null} />;
  return (
    <a href={`mailto:${value}`} className="underline-offset-4 hover:underline">
      {value}
    </a>
  );
}

function PhoneValue({ value }: { value: string | null }) {
  if (!value) return <TextValue value={null} />;
  return (
    <a href={`tel:${value}`} className="underline-offset-4 hover:underline">
      {value}
    </a>
  );
}

function LinkValue({ value }: { value: string | null }) {
  if (!value) return <TextValue value={null} />;
  const href = externalHref(value);
  if (!href) return <TextValue value={value} />;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all underline-offset-4 hover:underline"
    >
      {value}
    </a>
  );
}

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    return (
      <div className="flex flex-col gap-3">
        <Link
          href="/contacts"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Contacts
        </Link>
        <h1 className="text-2xl font-semibold">Contact</h1>
        <p role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      </div>
    );
  }
  if (!data) notFound();

  const contact = normalizeContact(data as Contact);
  const followUp = followUpPresentation(contact.next_follow_up_on);
  const method = contactMethodLabel(contact.preferred_contact_method);
  const subtitle = [contact.title, contact.business_name].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <Link
            href="/contacts"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Contacts
          </Link>
          <h1 className="text-2xl font-semibold">{contact.name}</h1>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {CONTACT_TYPE_LABELS[contact.contact_type] ?? contact.contact_type}
            </Badge>
            <ContactStatusBadge status={contact.status} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ContactDialog contact={contact} />
          <form action={deleteContact}>
            <input type="hidden" name="id" value={contact.id} />
            <input type="hidden" name="redirect_to" value="/contacts" />
            <Button variant="destructive" size="sm" type="submit">
              Delete
            </Button>
          </form>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Reach</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailItem label="Email">
                <MailValue value={contact.email} />
              </DetailItem>
              <DetailItem label="Phone">
                <PhoneValue value={contact.phone} />
              </DetailItem>
              <DetailItem label="Secondary email">
                <MailValue value={contact.secondary_email} />
              </DetailItem>
              <DetailItem label="Secondary phone">
                <PhoneValue value={contact.secondary_phone} />
              </DetailItem>
              <DetailItem label="Website">
                <LinkValue value={contact.website} />
              </DetailItem>
              <DetailItem label="Social">
                <TextValue value={contact.social_handle} />
              </DetailItem>
              <DetailItem label="Preferred contact method">
                <TextValue value={method} />
              </DetailItem>
              <DetailItem label="Address / location">
                <TextValue value={contact.location} />
              </DetailItem>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailItem label="Related event or opportunity">
                <TextValue value={contact.related_event} />
              </DetailItem>
              <DetailItem label="Source">
                <LinkValue value={contact.source} />
              </DetailItem>
              <DetailItem label="Last contacted">
                {contact.last_contacted_on ? (
                  formatContactDate(contact.last_contacted_on)
                ) : (
                  <TextValue value={null} />
                )}
              </DetailItem>
              <DetailItem label="Next follow-up">
                <span className={followUp.className}>{followUp.label}</span>
              </DetailItem>
              <DetailItem label="Added">
                {new Date(contact.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </DetailItem>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <TextValue value={contact.notes} />
        </CardContent>
      </Card>
    </div>
  );
}
