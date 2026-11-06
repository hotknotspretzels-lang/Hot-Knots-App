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
import { deleteContact } from "./actions";
import { ContactTypeFilter } from "./contact-type-filter";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("contacts").select("*").order("name", { ascending: true });
  if (type) query = query.eq("contact_type", type as ContactType);

  const { data: contacts } = await query;
  const contactList = (contacts ?? []) as Contact[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Contacts</h1>
          <p className="text-sm text-muted-foreground">
            Venues, organizers, vendors, and everyone else you work with.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ContactTypeFilter />
          <ContactDialog />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Business / venue</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Social</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {contactList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                No contacts yet. Add your first one to get started.
              </TableCell>
            </TableRow>
          ) : (
            contactList.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.business_name ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{CONTACT_TYPE_LABELS[c.contact_type]}</Badge>
                </TableCell>
                <TableCell>{c.email ?? "—"}</TableCell>
                <TableCell>{c.phone ?? "—"}</TableCell>
                <TableCell>{c.social_handle ?? "—"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <ContactDialog contact={c} />
                    <form action={deleteContact}>
                      <input type="hidden" name="id" value={c.id} />
                      <Button variant="ghost" size="sm" type="submit">
                        Delete
                      </Button>
                    </form>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
