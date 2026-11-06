import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type {
  CalendarTask,
  Contact,
  Event,
  EventDay,
  EventStatus,
  SocialStrategyPlan,
} from "@/lib/types";
import { SOCIAL_PLATFORM_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatTimeRange } from "@/lib/event-days";
import { Button } from "@/components/ui/button";
import { CalendarNav } from "./calendar-nav";
import { AddCalendarItemDialog } from "./add-calendar-item-dialog";
import { deleteCalendarTask, toggleCalendarTaskDone } from "./actions";

const STATUS_CLASSES: Record<EventStatus, string> = {
  planned: "bg-primary/10 text-primary",
  completed: "bg-primary text-primary-foreground",
  cancelled: "bg-muted text-muted-foreground line-through",
};

type EventDayWithEvent = EventDay & { events: Event };

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfWeek(d: Date): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day; // shift back to Monday
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function formatTime(time: string | null): string | null {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(hours, minutes);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; day?: string }>;
}) {
  const { month: monthParam, day: dayParam } = await searchParams;
  const now = new Date();
  const [year, monthIndex] = monthParam
    ? monthParam.split("-").map((n) => Number(n))
    : [now.getFullYear(), now.getMonth() + 1];
  const targetMonth = new Date(year, monthIndex - 1, 1);
  const monthKey = `${year}-${String(monthIndex).padStart(2, "0")}`;
  const todayKey = toDateKey(now);

  const gridStart = startOfWeek(targetMonth);
  const gridEnd = new Date(gridStart);
  gridEnd.setDate(gridEnd.getDate() + 41); // 6 weeks

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    days.push(d);
  }

  const supabase = await createClient();
  const [{ data: eventDays }, { data: strategyItems }, { data: tasks }, { data: contacts }] =
    await Promise.all([
      supabase
        .from("event_days")
        .select("*, events!inner(*)")
        .gte("day_date", toDateKey(gridStart))
        .lte("day_date", toDateKey(gridEnd)),
      supabase
        .from("social_strategy_plan")
        .select("*")
        .gte("planned_date", toDateKey(gridStart))
        .lte("planned_date", toDateKey(gridEnd)),
      supabase
        .from("calendar_tasks")
        .select("*")
        .gte("due_date", toDateKey(gridStart))
        .lte("due_date", toDateKey(gridEnd)),
      supabase.from("contacts").select("*").order("name", { ascending: true }),
    ]);
  const eventDayList = (eventDays ?? []) as EventDayWithEvent[];
  const strategyList = (strategyItems ?? []) as SocialStrategyPlan[];
  const taskList = (tasks ?? []) as CalendarTask[];
  const contactList = (contacts ?? []) as Contact[];
  const contactsById = new Map(contactList.map((c) => [c.id, c]));

  const eventsByDay = new Map<string, EventDayWithEvent[]>();
  for (const d of eventDayList) {
    const list = eventsByDay.get(d.day_date) ?? [];
    list.push(d);
    eventsByDay.set(d.day_date, list);
  }

  const strategyByDay = new Map<string, SocialStrategyPlan[]>();
  for (const s of strategyList) {
    const list = strategyByDay.get(s.planned_date) ?? [];
    list.push(s);
    strategyByDay.set(s.planned_date, list);
  }

  const tasksByDay = new Map<string, CalendarTask[]>();
  for (const t of taskList) {
    const list = tasksByDay.get(t.due_date) ?? [];
    list.push(t);
    tasksByDay.set(t.due_date, list);
  }

  const monthLabel = targetMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const selectedEvents = dayParam ? (eventsByDay.get(dayParam) ?? []) : [];
  const selectedStrategyItems = dayParam
    ? (strategyByDay.get(dayParam) ?? [])
    : [];
  const selectedTasks = dayParam ? (tasksByDay.get(dayParam) ?? []) : [];
  const selectedDateLabel = dayParam
    ? new Date(`${dayParam}T00:00:00`).toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : null;
  const hasSelectedItems =
    selectedEvents.length > 0 ||
    selectedTasks.length > 0 ||
    selectedStrategyItems.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Your event schedule and internal to-dos — click any day to add
            something.
          </p>
        </div>
        <CalendarNav monthLabel={monthLabel} year={year} monthIndex={monthIndex} />
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div
            key={d}
            className="bg-muted px-2 py-1 text-center text-xs font-medium text-muted-foreground"
          >
            {d}
          </div>
        ))}
        {days.map((day) => {
          const key = toDateKey(day);
          const inMonth = day.getMonth() === monthIndex - 1;
          const isToday = key === todayKey;
          const isSelected = dayParam === key;
          const dayEvents = eventsByDay.get(key) ?? [];
          const dayStrategyItems = strategyByDay.get(key) ?? [];
          const dayTasks = tasksByDay.get(key) ?? [];

          return (
            <div
              key={key}
              className={cn(
                "flex min-h-28 flex-col gap-1 bg-background p-2",
                !inMonth && "bg-muted/30",
                isSelected && "ring-1 ring-inset ring-primary/40",
              )}
            >
              <div className="flex items-center justify-between">
                <Link
                  href={`/calendar?month=${monthKey}&day=${key}`}
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full text-xs transition-colors",
                    isToday
                      ? "bg-destructive font-semibold text-destructive-foreground"
                      : inMonth
                        ? "text-foreground"
                        : "text-muted-foreground",
                    isSelected &&
                      !isToday &&
                      "bg-primary font-semibold text-primary-foreground",
                    isSelected &&
                      isToday &&
                      "ring-2 ring-primary ring-offset-1 ring-offset-background",
                  )}
                >
                  {day.getDate()}
                </Link>
                <AddCalendarItemDialog
                  defaultDate={key}
                  contacts={contactList}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground"
                    >
                      +
                    </Button>
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                {dayEvents.map((d) => {
                  const e = d.events;
                  const tooltip = [
                    e.name,
                    formatTimeRange(d.start_time, d.end_time),
                    e.contact_id ? contactsById.get(e.contact_id)?.name : null,
                  ]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <Link
                      key={d.id}
                      href={`/events/${e.id}`}
                      title={tooltip}
                      className={cn(
                        "truncate rounded px-1.5 py-0.5 text-xs",
                        STATUS_CLASSES[e.status],
                      )}
                    >
                      {e.name}
                    </Link>
                  );
                })}
                {dayStrategyItems.map((s) => (
                  <span
                    key={s.id}
                    title={`${SOCIAL_PLATFORM_LABELS[s.platform]}: ${s.content_idea}`}
                    className="truncate rounded border border-dashed px-1.5 py-0.5 text-xs text-muted-foreground"
                  >
                    📱 {s.content_idea}
                  </span>
                ))}
                {dayTasks.map((t) => {
                  const tooltip = [
                    t.title,
                    formatTime(t.due_time),
                    t.contact_id ? contactsById.get(t.contact_id)?.name : null,
                    t.notes,
                  ]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <div key={t.id} className="group/task flex items-center gap-1">
                      <form action={toggleCalendarTaskDone} className="min-w-0 flex-1">
                        <input type="hidden" name="id" value={t.id} />
                        <input type="hidden" name="is_done" value={String(t.is_done)} />
                        <button
                          type="submit"
                          title={tooltip}
                          className={cn(
                            "block w-full truncate rounded border border-dashed px-1.5 py-0.5 text-left text-xs",
                            t.is_done
                              ? "text-muted-foreground line-through"
                              : "text-foreground",
                          )}
                        >
                          {t.title}
                        </button>
                      </form>
                      <form action={deleteCalendarTask}>
                        <input type="hidden" name="id" value={t.id} />
                        <button
                          type="submit"
                          title="Delete"
                          className="hidden shrink-0 text-muted-foreground hover:text-foreground group-hover/task:block"
                        >
                          ×
                        </button>
                      </form>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 rounded-lg border p-4">
        {!dayParam && (
          <p className="text-sm text-muted-foreground">
            Click a day above to see its schedule.
          </p>
        )}
        {dayParam && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">{selectedDateLabel}</h2>
              <Link
                href={`/calendar?month=${monthKey}`}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Clear
              </Link>
            </div>
            {!hasSelectedItems && (
              <p className="text-sm text-muted-foreground">
                Nothing scheduled for this day.
              </p>
            )}
            {selectedEvents.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {selectedEvents.map((d) => {
                  const e = d.events;
                  const subtitle = [
                    formatTimeRange(d.start_time, d.end_time),
                    e.location,
                    e.contact_id ? contactsById.get(e.contact_id)?.name : null,
                  ]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <Link
                      key={d.id}
                      href={`/events/${e.id}`}
                      className="flex items-center justify-between gap-2 rounded-md border p-2 hover:bg-muted/50"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {e.name}
                        </div>
                        {subtitle && (
                          <div className="truncate text-xs text-muted-foreground">
                            {subtitle}
                          </div>
                        )}
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded px-1.5 py-0.5 text-xs",
                          STATUS_CLASSES[e.status],
                        )}
                      >
                        {e.status}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
            {selectedTasks.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {selectedTasks.map((t) => {
                  const subtitle = [
                    formatTime(t.due_time),
                    t.contact_id ? contactsById.get(t.contact_id)?.name : null,
                  ]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <div
                      key={t.id}
                      className="group/task flex items-center justify-between gap-2 rounded-md border border-dashed p-2"
                    >
                      <div className="min-w-0 flex-1">
                        <form action={toggleCalendarTaskDone}>
                          <input type="hidden" name="id" value={t.id} />
                          <input
                            type="hidden"
                            name="is_done"
                            value={String(t.is_done)}
                          />
                          <button
                            type="submit"
                            className={cn(
                              "block text-left text-sm",
                              t.is_done
                                ? "text-muted-foreground line-through"
                                : "text-foreground",
                            )}
                          >
                            {t.title}
                          </button>
                        </form>
                        {subtitle && (
                          <div className="truncate text-xs text-muted-foreground">
                            {subtitle}
                          </div>
                        )}
                        {t.notes && (
                          <div className="text-xs text-muted-foreground">
                            {t.notes}
                          </div>
                        )}
                      </div>
                      <form action={deleteCalendarTask}>
                        <input type="hidden" name="id" value={t.id} />
                        <button
                          type="submit"
                          title="Delete"
                          className="hidden shrink-0 text-muted-foreground hover:text-foreground group-hover/task:block"
                        >
                          ×
                        </button>
                      </form>
                    </div>
                  );
                })}
              </div>
            )}
            {selectedStrategyItems.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {selectedStrategyItems.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-md border border-dashed p-2"
                  >
                    <div className="text-xs font-medium text-muted-foreground">
                      📱 {SOCIAL_PLATFORM_LABELS[s.platform]}
                    </div>
                    <div className="text-sm">{s.content_idea}</div>
                    {(s.status || s.notes) && (
                      <div className="text-xs text-muted-foreground">
                        {[s.status, s.notes].filter(Boolean).join(" · ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
