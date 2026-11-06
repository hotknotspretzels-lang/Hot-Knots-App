"use client";

import {
  Combobox,
  ComboboxClear,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
  ComboboxPopup,
  ComboboxPortal,
  ComboboxPositioner,
} from "@/components/ui/combobox";
import type { Contact } from "@/lib/types";

function contactLabel(c: Contact): string {
  return c.business_name ? `${c.name} (${c.business_name})` : c.name;
}

type ContactItem = { value: string; label: string };

export function ContactSelect({
  id,
  contacts,
  name = "contact_id",
  defaultValue,
}: {
  id: string;
  contacts: Contact[];
  name?: string;
  defaultValue?: string;
}) {
  const items: ContactItem[] = contacts.map((c) => ({
    value: c.id,
    label: contactLabel(c),
  }));
  const defaultItem = defaultValue
    ? (items.find((i) => i.value === defaultValue) ?? null)
    : null;

  return (
    <Combobox
      items={items}
      name={name}
      defaultValue={defaultItem}
      isItemEqualToValue={(a: ContactItem, b: ContactItem) => a.value === b.value}
    >
      <ComboboxInputGroup>
        <ComboboxInput id={id} placeholder="Search contacts…" />
        <ComboboxClear />
      </ComboboxInputGroup>
      <ComboboxPortal>
        <ComboboxPositioner>
          <ComboboxPopup>
            <ComboboxEmpty>No contacts found.</ComboboxEmpty>
            <ComboboxList>
              {(item: ContactItem) => (
                <ComboboxItem key={item.value} value={item}>
                  {item.label}
                  <ComboboxItemIndicator />
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxPopup>
        </ComboboxPositioner>
      </ComboboxPortal>
    </Combobox>
  );
}
