"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ItemFields({
  idPrefix,
  defaultTitle = "",
  defaultQuantity = "",
  defaultUnit = "",
  defaultScales = true,
}: {
  idPrefix: string;
  defaultTitle?: string;
  defaultQuantity?: string;
  defaultUnit?: string;
  defaultScales?: boolean;
}) {
  const [quantity, setQuantity] = useState(defaultQuantity);
  const [scales, setScales] = useState(defaultScales);
  const hasQuantity = quantity.trim() !== "";

  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-title`}>Item</Label>
        <Input
          id={`${idPrefix}-title`}
          name="title"
          required
          maxLength={200}
          defaultValue={defaultTitle}
          placeholder="Dough balls"
          autoComplete="off"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-quantity`}>Quantity</Label>
          <Input
            id={`${idPrefix}-quantity`}
            name="quantity"
            inputMode="decimal"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            placeholder="120"
            autoComplete="off"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-unit`}>Unit</Label>
          <Input
            id={`${idPrefix}-unit`}
            name="unit"
            maxLength={40}
            defaultValue={defaultUnit}
            placeholder="each"
            autoComplete="off"
          />
        </div>
      </div>
      <input type="hidden" name="scales" value={hasQuantity && scales ? "true" : "false"} />
      <label className="flex items-start gap-3">
        <Checkbox
          className="mt-0.5"
          checked={hasQuantity && scales}
          disabled={!hasQuantity}
          onCheckedChange={(checked) => setScales(checked === true)}
        />
        <span className="text-sm">
          Scale with the customer count
          <span className="mt-1 block text-xs text-muted-foreground">
            Leave quantity blank for a plain checkbox, like “Bring generator”. Turn scaling off for
            a fixed amount, like 1 propane tank. Scaled amounts round up to a whole unit.
          </span>
        </span>
      </label>
    </>
  );
}
