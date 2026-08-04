"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { startOfToday, toISODate } from "@/lib/dates";
import { taskDeadline } from "@/lib/mock-data";
import type { Project, Task } from "@/lib/types";
import { STATUS_STYLES } from "./status-badge";

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const MONTH_FMT = new Intl.DateTimeFormat("th-TH", {
  month: "long",
  year: "numeric",
});

/**
 * Monthly calendar mapping each task to its deadline date. Scaffold view:
 * read-only chips grouped by day, with month navigation.
 */
export function CalendarView({
  projects,
  tasks,
}: {
  projects: Project[];
  tasks: Task[];
}) {
  const [cursor, setCursor] = React.useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const projectById = React.useMemo(() => {
    const m = new Map<string, Project>();
    projects.forEach((p) => m.set(p.id, p));
    return m;
  }, [projects]);

  // Bucket every task onto its deadline day (yyyy-mm-dd).
  const tasksByDate = React.useMemo(() => {
    const map = new Map<string, { task: Task; project: Project }[]>();
    for (const t of tasks) {
      const project = projectById.get(t.projectId);
      if (!project || !project.releaseDate) continue;
      const iso = toISODate(taskDeadline(t, project));
      if (!map.has(iso)) map.set(iso, []);
      map.get(iso)!.push({ task: t, project });
    }
    return map;
  }, [tasks, projectById]);

  // 6-week (42-cell) grid starting on the Sunday on/before the 1st.
  const cells = React.useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    const startDay = first.getDay();
    return Array.from(
      { length: 42 },
      (_, i) => new Date(cursor.year, cursor.month, 1 - startDay + i)
    );
  }, [cursor]);

  const todayIso = toISODate(startOfToday());
  const title = MONTH_FMT.format(new Date(cursor.year, cursor.month, 1));

  const shiftMonth = (delta: number) =>
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  const goToday = () => {
    const now = new Date();
    setCursor({ year: now.getFullYear(), month: now.getMonth() });
  };

  return (
    <div className="overflow-hidden rounded-xl border">
      {/* Header — month navigation */}
      <div className="flex items-center gap-2 border-b p-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => shiftMonth(-1)}
          aria-label="เดือนก่อนหน้า"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => shiftMonth(1)}
          aria-label="เดือนถัดไป"
        >
          <ChevronRight className="size-4" />
        </Button>
        <div className="ml-1 text-lg font-semibold tracking-tight">{title}</div>
        <Button variant="ghost" size="sm" className="ml-auto" onClick={goToday}>
          วันนี้
        </Button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-xs font-medium text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {cells.map((date, i) => {
          const iso = toISODate(date);
          const inMonth = date.getMonth() === cursor.month;
          const isToday = iso === todayIso;
          const dayTasks = tasksByDate.get(iso) ?? [];
          return (
            <div
              key={iso}
              className={cn(
                "min-h-28 border-b border-r p-1.5",
                i % 7 === 6 && "border-r-0",
                i >= 35 && "border-b-0",
                !inMonth && "bg-muted/25 text-muted-foreground"
              )}
            >
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
                    isToday && "bg-foreground font-semibold text-background"
                  )}
                >
                  {date.getDate()}
                </span>
                {dayTasks.length > 0 && (
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    {dayTasks.length}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map(({ task, project }) => (
                  <div
                    key={task.id}
                    title={`${project.songName} — ${task.name}${
                      task.person ? ` · ${task.person}` : ""
                    }`}
                    className={cn(
                      "truncate rounded border border-transparent px-1 py-0.5 text-[10px] font-medium",
                      STATUS_STYLES[task.status]
                    )}
                  >
                    {task.name}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="px-1 text-[10px] text-muted-foreground">
                    +{dayTasks.length - 3} เพิ่มเติม
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
