"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { TodoItem } from "@/lib/types";
import { setTodoItemDone } from "./actions";

export function TodoItemRow({ item }: { item: TodoItem }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [checked, setChecked] = useState(false);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await setTodoItemDone(formData);
        toast(`Completed "${item.title}"`, {
          action: {
            label: "Undo",
            onClick: () => {
              const undo = new FormData();
              undo.set("id", item.id);
              undo.set("is_done", "false");
              // The row may still be mounted if Undo lands before the list
              // re-renders; uncheck it so it isn't left struck through.
              setChecked(false);
              void setTodoItemDone(undo);
            },
          },
        });
      }}
    >
      <input type="hidden" name="id" value={item.id} />
      <input type="hidden" name="is_done" value="true" />
      <label
        className={cn(
          "flex cursor-pointer items-start gap-3 rounded-md px-2 py-1.5 hover:bg-muted",
          checked && "text-muted-foreground line-through opacity-60",
        )}
      >
        <Checkbox
          className="mt-0.5"
          checked={checked}
          disabled={checked}
          onCheckedChange={() => {
            setChecked(true);
            formRef.current?.requestSubmit();
          }}
        />
        <span className="min-w-0 break-words">{item.title}</span>
      </label>
    </form>
  );
}
