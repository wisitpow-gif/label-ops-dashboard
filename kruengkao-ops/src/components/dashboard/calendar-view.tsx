"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { diffDays, startOfToday, toISODate } from "@/lib/dates";
import { taskDeadline, taskStart } from "@/lib/mock-data";
import type { Project, Task } from "@/lib/types";

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const MONTH_FMT = new Intl.DateTimeFormat("th-TH", {
  month: "long",
  year: "numeric",
});

// Subtle per-role tint so the calendar is scannable at a glance.
const ROLE_TINT: Record<string, string> = {
  Promoter:
    "bg-blue-100 text-blue-900 hover:bg-blue-200 dark:bg-blue-500/25 dark:text-blue-50 dark:hover:bg-blue-500/40",
  "Creative/MarCom":
    "bg-pink-100 text-pink-900 hover:bg-pink-200 dark:bg-pink-500/25 dark:text-pink-50 dark:hover:bg-pink-500/40",
  Graphics:
    "bg-violet-100 text-violet-900 hover:bg-violet-200 dark:bg-violet-500/25 dark:text-violet-50 dark:hover:bg-violet-500/40",
  Producer:
    "bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-500/25 dark:text-emerald-50 dark:hover:bg-emerald-500/40",
  Digital:
    "bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-500/25 dark:text-amber-50 dark:hover:bg-amber-500/40",
  Distributor:
    "bg-cyan-100 text-cyan-900 hover:bg-cyan-200 dark:bg-cyan-500/25 dark:text-cyan-50 dark:hover:bg-cyan-500/40",
};
const ROLE_TINT_FALLBACK =
  "bg-muted text-foreground hover:bg-muted/70 dark:bg-muted/60";

const MAX_LANES = 4;

interface CalEvent {
  task: Task;
  project: Project;
  start: Date;
  end: Date;
}

interface Segment {
  ev: CalEvent;
  startCol: number; // 0-6 within the week
  endCol: number; // 0-6 within the week
  continuesLeft: boolean;
  continuesRight: boolean;
}

/**
 * Monthly calendar with multi-day task bars. Each task spans its start→end
 * date range; bars are colored by role, labeled "Project - Task", and open
 * the Edit Task modal on click.
 */
export function CalendarView({
  projects,
  tasks,
  onEditTask,
}: {
  projects: Project[];
  tasks: Task[];
  onEditTask: (task: Task) => void;
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

  // Resolve each task to a start→end date range (stored dates win; workback
  // is the fallback). Skip anything we can't place.
  const events = React.useMemo(() => {
    const out: CalEvent[] = [];
    for (const t of tasks) {
      const project = projectById.get(t.projectId);
      if (!project) continue;
      const s = taskStart(t, project);
      const e = taskDeadline(t, project);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) continue;
      out.push({
        task: t,
        project,
        start: s <= e ? s : e,
        end: s <= e ? e : s,
      });
    }
    return out;
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

  // Segments of events intersecting a week, packed into non-overlapping lanes.
  function packWeek(weekStart: Date, weekEnd: Date) {
    const segs: Segment[] = [];
    for (const ev of events) {
      if (ev.end < weekStart || ev.start > weekEnd) continue;
      const segStart = ev.start < weekStart ? weekStart : ev.start;
      const segEnd = ev.end > weekEnd ? weekEnd : ev.end;
      segs.push({
        ev,
        startCol: diffDays(weekStart, segStart),
        endCol: diffDays(weekStart, segEnd),
        continuesLeft: ev.start < weekStart,
        continuesRight: ev.end > weekEnd,
      });
    }
    segs.sort((a, b) => a.startCol - b.startCol || b.endCol - a.endCol);

    const lanes: { segs: Segment[]; last: number }[] = [];
    let overflow = 0;
    for (const seg of segs) {
      const lane = lanes.find((l) => l.last < seg.startCol);
      if (lane) {
        lane.segs.push(seg);
        lane.last = seg.endCol;
      } else if (lanes.length < MAX_LANES) {
        lanes.push({ segs: [seg], last: seg.endCol });
      } else {
        overflow += 1;
      }
    }
    return { lanes, overflow };
  }

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

      {/* Weeks */}
      <div className="overflow-x-auto">
        <div className="min-w-[44rem]">
          {Array.from({ length: 6 }, (_, w) => {
            const weekDays = cells.slice(w * 7, w * 7 + 7);
            const weekStart = weekDays[0];
            const weekEnd = weekDays[6];
            const { lanes, overflow } = packWeek(weekStart, weekEnd);
            return (
              <div key={w} className="border-b last:border-b-0">
                {/* Day numbers */}
                <div className="grid grid-cols-7">
                  {weekDays.map((d) => {
                    const inMonth = d.getMonth() === cursor.month;
                    const isToday = toISODate(d) === todayIso;
                    return (
                      <div
                        key={toISODate(d)}
                        className={cn(
                          "border-l px-2 pt-1 first:border-l-0",
                          !inMonth && "bg-muted/25"
                        )}
                      >
                        <div className="text-right text-xs">
                          <span
                            className={cn(
                              "inline-flex size-5 items-center justify-center rounded-full tabular-nums",
                              isToday && "bg-foreground font-semibold text-background",
                              !inMonth && !isToday && "text-muted-foreground"
                            )}
                          >
                            {d.getDate()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Task bars */}
                <div className="min-h-[3.5rem] space-y-1 px-0.5 pb-1.5 pt-0.5">
                  {lanes.map((lane, li) => (
                    <div key={li} className="grid grid-cols-7">
                      {lane.segs.map((seg) => (
                        <button
                          key={seg.ev.task.id}
                          type="button"
                          onClick={() => onEditTask(seg.ev.task)}
                          title={`${seg.ev.project.songName} - ${seg.ev.task.name}`}
                          style={{
                            gridColumn: `${seg.startCol + 1} / ${seg.endCol + 2}`,
                          }}
                          className={cn(
                            "mx-0.5 truncate rounded px-1.5 py-0.5 text-left text-[10px] font-medium transition-colors",
                            ROLE_TINT[seg.ev.task.role] ?? ROLE_TINT_FALLBACK,
                            seg.continuesLeft && "rounded-l-none",
                            seg.continuesRight && "rounded-r-none"
                          )}
                        >
                          {seg.ev.project.songName} - {seg.ev.task.name}
                        </button>
                      ))}
                    </div>
                  ))}
                  {overflow > 0 && (
                    <div className="px-1.5 text-[10px] text-muted-foreground">
                      +{overflow} เพิ่มเติม
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
