import { INQUIRY_STATUS_LABELS, type Inquiry } from "@/lib/types";

export function inquiryBadge(inquiry: Pick<Inquiry, "status" | "is_read">): {
  label: string;
  variant: "default" | "secondary";
} {
  if (inquiry.is_read && inquiry.status === "new") {
    return { label: "Read", variant: "secondary" };
  }
  return {
    label: INQUIRY_STATUS_LABELS[inquiry.status],
    variant: !inquiry.is_read && inquiry.status === "new" ? "default" : "secondary",
  };
}
