import {
  CONTACT_METHOD_LABELS,
  CONTACT_STATUS_LABELS,
  CONTACT_TYPE_LABELS,
  type Contact,
  type ContactMethod,
  type ContactStatus,
  type ContactType,
} from "@/lib/types";

export function isContactType(value: string): value is ContactType {
  return value in CONTACT_TYPE_LABELS;
}

export function isContactStatus(value: string): value is ContactStatus {
  return value in CONTACT_STATUS_LABELS;
}

export function normalizeContact(row: Contact): Contact {
  const status = row.status && isContactStatus(row.status) ? row.status : null;
  const method =
    row.preferred_contact_method &&
    row.preferred_contact_method in CONTACT_METHOD_LABELS
      ? row.preferred_contact_method
      : null;

  return {
    ...row,
    title: row.title ?? null,
    business_name: row.business_name ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    secondary_email: row.secondary_email ?? null,
    secondary_phone: row.secondary_phone ?? null,
    website: row.website ?? null,
    social_handle: row.social_handle ?? null,
    location: row.location ?? null,
    related_event: row.related_event ?? null,
    source: row.source ?? null,
    status,
    last_contacted_on: row.last_contacted_on ?? null,
    next_follow_up_on: row.next_follow_up_on ?? null,
    preferred_contact_method: method,
    notes: row.notes ?? null,
  };
}

export function formatContactDate(value: string | null | undefined): string {
  if (!value) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function localToday(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function followUpPresentation(value: string | null | undefined): {
  label: string;
  className: string;
} {
  if (!value) return { label: "—", className: "text-muted-foreground" };
  const day = value.slice(0, 10);
  const today = localToday();
  const label = formatContactDate(day);
  if (day < today) {
    return { label: `${label} · Overdue`, className: "font-medium text-destructive" };
  }
  if (day === today) {
    return { label: `${label} · Today`, className: "font-medium" };
  }
  return { label, className: "" };
}

export function contactMethodLabel(method: ContactMethod | null): string | null {
  if (!method) return null;
  return CONTACT_METHOD_LABELS[method];
}

export function externalHref(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[\w.-]+\.[a-z]{2,}([/?#].*)?$/i.test(trimmed)) return `https://${trimmed}`;
  return null;
}
