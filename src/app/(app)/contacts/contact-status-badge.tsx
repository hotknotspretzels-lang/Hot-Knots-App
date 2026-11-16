import { Badge } from "@/components/ui/badge";
import { CONTACT_STATUS_LABELS, type ContactStatus } from "@/lib/types";

const STATUS_VARIANT: Record<
  ContactStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  prospect: "outline",
  contacted: "secondary",
  awaiting_reply: "secondary",
  in_conversation: "default",
  booked: "default",
  declined: "outline",
  bounced: "destructive",
};

export function ContactStatusBadge({ status }: { status: ContactStatus | null }) {
  if (!status || !(status in CONTACT_STATUS_LABELS)) {
    return <span className="text-muted-foreground">—</span>;
  }
  return <Badge variant={STATUS_VARIANT[status]}>{CONTACT_STATUS_LABELS[status]}</Badge>;
}
