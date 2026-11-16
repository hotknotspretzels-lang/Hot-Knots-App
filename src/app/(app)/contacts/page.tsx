import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Contact, ContactType } from "@/lib/types";
import { CONTACT_TYPE_LABELS } from "@/lib/types";
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
import { ContactDialog } from "./contact-dialog";
import { ContactFilters } from "./contact-filters";
import { ContactStatusBadge } from "./contact-status-badge";
import { deleteContact } from "./actions";
import {
  followUpPresentation,
  isContactStatus,
  isContactType,
  normalizeContact,
} from "./contact-format";

function Blank({ value }: { value: string | null }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  return value;
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string }>;
}) {
  const { type, status } = await searchParams;
  const contactType: ContactType | undefined =
    type && isContactType(type) ? type : undefined;
  const contactStatus = status && isContactStatus(status) ? status : undefined;
  const supabase = await createClient();

  let query = supabase.from("contacts").select("*").order("name", { ascending: true });
  if (contactType) query = query.eq("contact_type", contactType);
  if (contactStatus) query = query.eq("status", contactStatus);

  const { data: contacts, error } = await query;
  const contactList = ((contacts ?? []) as Contact[]).map(normalizeContact);
  const filtered = Boolean(contactType || contactStatus);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Contacts</h1>
          <p className="text-sm text-muted-foreground">
            Venues, organizers, vendors, and other booking contacts. Open a name
            for the full record.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Suspense
            fallback={
              <div className="flex gap-2" aria-hidden="true">
                <div className="h-8 w-44 rounded-lg border bg-muted/40" />
                <div className="h-8 w-52 rounded-lg border bg-muted/40" />
              </div>
            }
          >
            <ContactFilters />
          </Suspense>
          <ContactDialog />
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Next follow-up</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contactList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  {filtered
                    ? "No contacts match these filters."
                    : "No contacts yet. Add your first one to get started."}
                </TableCell>
              </TableRow>
            ) : (
              contactList.map((contact) => {
                const followUp = followUpPresentation(contact.next_follow_up_on);
                return (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">
                      <Link href={`/contacts/${contact.id}`} className="hover:underline">
                        {contact.name}
                      </Link>
                      {contact.email ? (
                        <div className="text-xs font-normal text-muted-foreground">
                          {contact.email}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Blank value={contact.title} />
                    </TableCell>
                    <TableCell>
                      <Blank value={contact.business_name} />
                    </TableCell>
                    <TableCell>
                      <ContactStatusBadge status={contact.status} />
                    </TableCell>
                    <TableCell className={followUp.className}>{followUp.label}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {CONTACT_TYPE_LABELS[contact.contact_type] ?? contact.contact_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ContactDialog contact={contact} />
                        <form action={deleteContact}>
                          <input type="hidden" name="id" value={contact.id} />
                          <Button variant="ghost" size="sm" type="submit">
                            Delete
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
