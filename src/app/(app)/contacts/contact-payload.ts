import {
  CONTACT_METHOD_LABELS,
  CONTACT_STATUS_LABELS,
  CONTACT_TYPE_LABELS,
  type ContactMethod,
  type ContactStatus,
  type ContactType,
} from "@/lib/types";

export type ContactWrite = {
  name: string;
  title: string | null;
  business_name: string | null;
  contact_type: ContactType;
  email: string | null;
  phone: string | null;
  secondary_email: string | null;
  secondary_phone: string | null;
  website: string | null;
  social_handle: string | null;
  location: string | null;
  related_event: string | null;
  source: string | null;
  status: ContactStatus | null;
  last_contacted_on: string | null;
  next_follow_up_on: string | null;
  preferred_contact_method: ContactMethod | null;
  notes: string | null;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function optionalText(formData: FormData, key: string): string | null {
  const raw = String(formData.get(key) ?? "").trim();
  return raw || null;
}

function optionalEmail(
  formData: FormData,
  key: string,
  label: string,
): { value: string | null } | { error: string } {
  const value = optionalText(formData, key);
  if (value && !EMAIL_PATTERN.test(value)) {
    return { error: `Enter a valid ${label}.` };
  }
  return { value };
}

function optionalDate(
  formData: FormData,
  key: string,
  label: string,
): { value: string | null } | { error: string } {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return { value: null };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return { error: `Enter a valid ${label}.` };
  }
  const parsed = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== raw) {
    return { error: `Enter a valid ${label}.` };
  }
  return { value: raw };
}

function isContactType(value: string): value is ContactType {
  return value in CONTACT_TYPE_LABELS;
}

function isContactStatus(value: string): value is ContactStatus {
  return value in CONTACT_STATUS_LABELS;
}

function isContactMethod(value: string): value is ContactMethod {
  return value in CONTACT_METHOD_LABELS;
}

export function contactWriteFromForm(
  formData: FormData,
): { data: ContactWrite } | { error: string } {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };

  const contactType = String(formData.get("contact_type") ?? "other");
  if (!isContactType(contactType)) return { error: "Choose a contact type." };

  const statusRaw = String(formData.get("status") ?? "").trim();
  let status: ContactStatus | null = null;
  if (statusRaw && statusRaw !== "unset") {
    if (!isContactStatus(statusRaw)) return { error: "Choose a status." };
    status = statusRaw;
  }

  const methodRaw = String(formData.get("preferred_contact_method") ?? "").trim();
  let preferred_contact_method: ContactMethod | null = null;
  if (methodRaw && methodRaw !== "unset") {
    if (!isContactMethod(methodRaw)) {
      return { error: "Choose a preferred contact method." };
    }
    preferred_contact_method = methodRaw;
  }

  const email = optionalEmail(formData, "email", "email");
  if ("error" in email) return email;
  const secondaryEmail = optionalEmail(formData, "secondary_email", "secondary email");
  if ("error" in secondaryEmail) return secondaryEmail;

  const lastContacted = optionalDate(formData, "last_contacted_on", "last contacted date");
  if ("error" in lastContacted) return lastContacted;
  const nextFollowUp = optionalDate(formData, "next_follow_up_on", "next follow-up date");
  if ("error" in nextFollowUp) return nextFollowUp;

  return {
    data: {
      name,
      title: optionalText(formData, "title"),
      business_name: optionalText(formData, "business_name"),
      contact_type: contactType,
      email: email.value,
      phone: optionalText(formData, "phone"),
      secondary_email: secondaryEmail.value,
      secondary_phone: optionalText(formData, "secondary_phone"),
      website: optionalText(formData, "website"),
      social_handle: optionalText(formData, "social_handle"),
      location: optionalText(formData, "location"),
      related_event: optionalText(formData, "related_event"),
      source: optionalText(formData, "source"),
      status,
      last_contacted_on: lastContacted.value,
      next_follow_up_on: nextFollowUp.value,
      preferred_contact_method,
      notes: optionalText(formData, "notes"),
    },
  };
}
