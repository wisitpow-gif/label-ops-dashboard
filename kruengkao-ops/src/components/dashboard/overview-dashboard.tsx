"use client";

import * as React from "react";
import {
  CalendarClock,
  CalendarDays,
  CircleUser,
  FolderKanban,
  ListChecks,
  Rocket,
  TriangleAlert,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  addDays,
  formatLongDate,
  formatShort,
  parseDate,
  startOfToday,
  toISODate,
} from "@/lib/dates";
import { initialsOf, taskDeadline } from "@/lib/mock-data";
import type { Project, Task } from "@/lib/types";
import { StatusSelect } from "./task-controls";

interface EnrichedTask {
  task: Task;
  project: Project;
  deadline: Date;
  deadlineIso: string;
}

function StatTile({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone?: "default" | "red" | "amber" | "emerald";
}) {
  const toneCls = {
    default: "text-foreground",
    red: "text-red-600 dark:text-red-400",
    amber: "text-amber-600 dark:text-amber-500",
    emerald: "text-emerald-600 dark:text-emerald-400",
  }[tone];
  return (
    <Card className="gap-0 py-4">
      <CardContent className="flex items-center gap-3 px-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          {icon}
        </div>
        <div className="min-w-0">
          <div className={cn("text-xl font-semibold tabular-nums", toneCls)}>
            {value}
          </div>
          <div className="truncate text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function OverviewDashboard({
  projects,
  tasks,
  currentPerson,
  onTaskUpdate,
  onEditTask,
}: {
  projects: Project[];
  tasks: Task[];
  currentPerson: string | null;
  onTaskUpdate: (taskId: string, patch: Partial<Task>) => void;
  onEditTask: (task: Task) => void;
}) {
  const today = startOfToday();
  const todayIso = toISODate(today);
  const soonCutoff = addDays(today, 2); // "next 48h" ≈ today + 2 days

  const projectById = React.useMemo(() => {
    const m = new Map<string, Project>();
    projects.forEach((p) => m.set(p.id, p));
    return m;
  }, [projects]);

  // Every schedulable task (any project, any owner) with its resolved deadline.
  const enriched = React.useMemo(() => {
    const out: EnrichedTask[] = [];
    for (const t of tasks) {
      const project = projectById.get(t.projectId);
      if (!project) continue;
      const deadline = taskDeadline(t, project);
      if (isNaN(deadline.getTime())) continue;
      out.push({ task: t, project, deadline, deadlineIso: toISODate(deadline) });
    }
    return out;
  }, [tasks, projectById]);

  // --- Global task triage (company-wide: ALL projects, ALL people) -----------
  const allActive = React.useMemo(
    () =>
      enriched
        .filter((e) => e.task.status !== "Done")
        .toSorted((a, b) => a.deadlineIso.localeCompare(b.deadlineIso)),
    [enriched]
  );

  const globalOverdue = allActive.filter((e) => e.deadlineIso < todayIso);
  const globalToday = allActive.filter((e) => e.deadlineIso === todayIso);
  const globalUpcoming = allActive.filter((e) => e.deadlineIso > todayIso);

  // --- KPI figures -----------------------------------------------------------
  // Active = not every task done (0-task projects count as active too).
  const activeProjectCount = React.useMemo(
    () =>
      projects.filter((p) => {
        const pts = tasks.filter((t) => t.projectId === p.id);
        const total = pts.length;
        const done = pts.filter((t) => t.status === "Done").length;
        return !(total > 0 && done === total);
      }).length,
    [projects, tasks]
  );

  const nextRelease = React.useMemo(() => {
    const iso = toISODate(startOfToday());
    return projects
      .filter((p) => p.releaseDate && p.releaseDate >= iso)
      .toSorted((a, b) => a.releaseDate.localeCompare(b.releaseDate))[0];
  }, [projects]);

  const overdueCount = globalOverdue.length;
  const dueSoonCount = allActive.filter(
    (e) => e.deadlineIso >= todayIso && e.deadline <= soonCutoff
  ).length;

  // --- Personal workspace ----------------------------------------------------
  const mine = React.useMemo(() => {
    if (!currentPerson) return [] as EnrichedTask[];
    return enriched
      .filter((e) => e.task.person === currentPerson && e.task.status !== "Done")
      .toSorted((a, b) => a.deadlineIso.localeCompare(b.deadlineIso));
  }, [enriched, currentPerson]);

  const myOverdue = mine.filter((e) => e.deadlineIso < todayIso);
  const myToday = mine.filter((e) => e.deadlineIso === todayIso);
  const myUpcoming = mine.filter((e) => e.deadlineIso > todayIso);

  // --- Render helpers --------------------------------------------------------
  /** Assignee chip — avatar + name, prominent so triage shows who holds it. */
  const assignee = (person: string) =>
    person ? (
      <span className="flex min-w-0 items-center gap-1.5">
        <Avatar className="size-6">
          <AvatarFallback className="text-[10px]">
            {initialsOf(person)}
          </AvatarFallback>
        </Avatar>
        <span className="truncate text-xs font-medium">{person}</span>
      </span>
    ) : (
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <span className="flex size-6 items-center justify-center rounded-full border border-dashed text-[10px]">
          ?
        </span>
        <span className="text-xs">ยังไม่มอบหมาย</span>
      </span>
    );

  /** Company-wide triage card — leads with assignee visibility. */
  const triageCard = (e: EnrichedTask) => (
    <div key={e.task.id} className="rounded-lg border bg-background p-2.5">
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => onEditTask(e.task)}
          className="min-w-0 text-left text-sm font-medium leading-snug hover:underline"
        >
          {e.task.name}
        </button>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {formatShort(e.deadline)}
        </span>
      </div>
      <div className="mt-0.5 truncate text-xs text-muted-foreground">
        {e.project.songName} · {e.project.label}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        {assignee(e.task.person)}
        <StatusSelect
          value={e.task.status}
          onChange={(status) => onTaskUpdate(e.task.id, { status })}
        />
      </div>
    </div>
  );

  /** Personal card — the owner is implicit (it's you), so no assignee chip. */
  const myTaskCard = (e: EnrichedTask) => (
    <div key={e.task.id} className="rounded-lg border bg-background p-2.5">
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => onEditTask(e.task)}
          className="min-w-0 text-left text-sm font-medium leading-snug hover:underline"
        >
          {e.task.name}
        </button>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {formatShort(e.deadline)}
        </span>
      </div>
      <div className="mt-0.5 truncate text-xs text-muted-foreground">
        {e.project.songName} · {e.project.label}
      </div>
      <div className="mt-2">
        <StatusSelect
          value={e.task.status}
          onChange={(status) => onTaskUpdate(e.task.id, { status })}
        />
      </div>
    </div>
  );

  const bucket = (
    title: string,
    items: EnrichedTask[],
    tone: "red" | "amber" | "default",
    renderItem: (e: EnrichedTask) => React.ReactNode
  ) => {
    const dot = {
      red: "bg-red-500",
      amber: "bg-amber-500",
      default: "bg-muted-foreground/40",
    }[tone];
    return (
      <div className="flex flex-col rounded-xl border bg-muted/30">
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <span className={cn("size-2.5 rounded-full", dot)} />
          <span className="text-sm font-semibold">{title}</span>
          <span className="ml-auto rounded-full bg-background px-2 text-xs tabular-nums text-muted-foreground">
            {items.length}
          </span>
        </div>
        <div className="scrollbar-subtle max-h-[380px] space-y-2 overflow-y-auto p-2">
          {items.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              ไม่มีงาน
            </p>
          ) : (
            items.map(renderItem)
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Current date — anchors the daily triage workflow */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <CalendarDays className="size-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">วันนี้</p>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            {formatLongDate(today)}
          </h1>
        </div>
      </div>

      {/* 2. Global Task Triage — company-wide, assignee-forward */}
      <section className="space-y-3">
        <h2 className="flex flex-wrap items-center gap-2 text-base font-semibold">
          <ListChecks className="size-4 text-muted-foreground" />
          Global Task Triage
          <span className="text-sm font-normal text-muted-foreground">
            · ทุกโปรเจกต์ / ทุกคน
          </span>
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {bucket("Overdue", globalOverdue, "red", triageCard)}
          {bucket("Due Today", globalToday, "amber", triageCard)}
          {bucket("Upcoming", globalUpcoming, "default", triageCard)}
        </div>
      </section>

      {/* 3. KPI summary tiles — visual divider */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          icon={<FolderKanban className="size-5" />}
          label="โปรเจกต์ที่กำลังทำ"
          value={activeProjectCount}
        />
        <StatTile
          icon={<TriangleAlert className="size-5" />}
          label="งานเกินกำหนด"
          value={overdueCount}
          tone={overdueCount > 0 ? "red" : "default"}
        />
        <StatTile
          icon={<CalendarClock className="size-5" />}
          label="ครบกำหนดใน 48 ชม."
          value={dueSoonCount}
          tone={dueSoonCount > 0 ? "amber" : "default"}
        />
        <StatTile
          icon={<Rocket className="size-5" />}
          label="ปล่อยเพลงถัดไป"
          value={
            nextRelease ? formatShort(parseDate(nextRelease.releaseDate)) : "—"
          }
        />
      </div>

      {/* 4. My Tasks — personal view for the logged-in member */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <CircleUser className="size-4 text-muted-foreground" />
          My Tasks
          {currentPerson && (
            <span className="flex items-center gap-1.5 text-sm font-normal text-muted-foreground">
              <Avatar className="size-5">
                <AvatarFallback className="text-[9px]">
                  {initialsOf(currentPerson)}
                </AvatarFallback>
              </Avatar>
              {currentPerson}
            </span>
          )}
        </h2>

        {!currentPerson ? (
          <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
            บัญชีของคุณยังไม่ได้เชื่อมกับสมาชิกในทีม — เพิ่มอีเมลของคุณให้ตรงกับ
            Team Member ในหน้า Settings เพื่อดูงานส่วนตัว
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {bucket("Overdue", myOverdue, "red", myTaskCard)}
            {bucket("Due Today", myToday, "amber", myTaskCard)}
            {bucket("Upcoming", myUpcoming, "default", myTaskCard)}
          </div>
        )}
      </section>
    </div>
  );
}
