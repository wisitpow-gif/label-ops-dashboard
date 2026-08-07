"use client";

import * as React from "react";
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CircleUser,
  FolderKanban,
  Rocket,
  TriangleAlert,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  addDays,
  diffDays,
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

/** Human relative-deadline label (Thai). */
function relLabel(daysFromToday: number): string {
  if (daysFromToday < 0) return `เกิน ${-daysFromToday} วัน`;
  if (daysFromToday === 0) return "วันนี้";
  if (daysFromToday === 1) return "พรุ่งนี้";
  return `อีก ${daysFromToday} วัน`;
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

  // --- Global project health -------------------------------------------------
  const activeProjects = React.useMemo(() => {
    const iso = toISODate(startOfToday());
    return projects
      .map((project) => {
        const pts = tasks.filter((t) => t.projectId === project.id);
        const done = pts.filter((t) => t.status === "Done").length;
        const total = pts.length;
        const notDone = pts
          .filter((t) => t.status !== "Done")
          .map((t) => ({ t, d: taskDeadline(t, project) }))
          .toSorted((a, b) => a.d.getTime() - b.d.getTime());
        return {
          project,
          done,
          total,
          pct: total ? Math.round((done / total) * 100) : 0,
          allDone: total > 0 && done === total,
          nextTask: notDone[0]?.t ?? null,
          overdue: pts.filter(
            (t) =>
              t.status !== "Done" &&
              toISODate(taskDeadline(t, project)) < iso
          ).length,
        };
      })
      .filter((x) => !x.allDone)
      .toSorted((a, b) =>
        a.project.releaseDate.localeCompare(b.project.releaseDate)
      );
  }, [projects, tasks]);

  const critical = React.useMemo(() => {
    const cutoff = addDays(startOfToday(), 2);
    return enriched
      .filter((e) => e.task.status !== "Done" && e.deadline <= cutoff)
      .toSorted((a, b) => a.deadlineIso.localeCompare(b.deadlineIso));
  }, [enriched]);

  const upcomingReleases = React.useMemo(() => {
    const iso = toISODate(startOfToday());
    return projects
      .filter((p) => p.releaseDate && p.releaseDate >= iso)
      .toSorted((a, b) => a.releaseDate.localeCompare(b.releaseDate));
  }, [projects]);

  const overdueCount = enriched.filter(
    (e) => e.task.status !== "Done" && e.deadlineIso < todayIso
  ).length;
  const dueSoonCount = enriched.filter(
    (e) =>
      e.task.status !== "Done" &&
      e.deadlineIso >= todayIso &&
      e.deadline <= soonCutoff
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
  const criticalRow = (e: EnrichedTask) => {
    const days = diffDays(today, e.deadline);
    const overdue = e.deadlineIso < todayIso;
    return (
      <button
        key={e.task.id}
        type="button"
        onClick={() => onEditTask(e.task)}
        className="flex w-full items-center gap-2 rounded-lg border p-2 text-left transition-colors hover:bg-muted/50"
      >
        <span
          className={cn(
            "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
            overdue
              ? "bg-red-500/15 text-red-700 dark:text-red-400"
              : "bg-amber-500/15 text-amber-700 dark:text-amber-500"
          )}
        >
          {relLabel(days)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{e.task.name}</div>
          <div className="truncate text-xs text-muted-foreground">
            {e.project.songName}
            {e.task.person ? ` · ${e.task.person}` : ""}
          </div>
        </div>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {formatShort(e.deadline)}
        </span>
      </button>
    );
  };

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
    tone: "red" | "amber" | "default"
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
        <div className="space-y-2 p-2">
          {items.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              ไม่มีงาน
            </p>
          ) : (
            items.map(myTaskCard)
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          icon={<FolderKanban className="size-5" />}
          label="โปรเจกต์ที่กำลังทำ"
          value={activeProjects.length}
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
            upcomingReleases[0]
              ? formatShort(parseDate(upcomingReleases[0].releaseDate))
              : "—"
          }
        />
      </div>

      {/* Global project health */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <FolderKanban className="size-4 text-muted-foreground" />
          Global Project Health
        </h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Active projects */}
          <div className="space-y-2 lg:col-span-2">
            {activeProjects.length === 0 ? (
              <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
                ไม่มีโปรเจกต์ที่กำลังดำเนินการ
              </div>
            ) : (
              activeProjects.map(
                ({ project, done, total, pct, nextTask, overdue }) => {
                  const days = diffDays(today, parseDate(project.releaseDate));
                  return (
                    <div
                      key={project.id}
                      className="rounded-xl border p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">
                            {project.songName}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {project.artistName} · {project.label}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="flex items-center gap-1 text-xs font-medium">
                            <CalendarDays className="size-3.5 text-muted-foreground" />
                            {formatShort(parseDate(project.releaseDate))}
                          </div>
                          <div
                            className={cn(
                              "text-[11px]",
                              days < 0
                                ? "text-red-600 dark:text-red-400"
                                : "text-muted-foreground"
                            )}
                          >
                            {relLabel(days)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Progress value={pct} className="h-1.5 flex-1" />
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                          {done}/{total}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                        {overdue > 0 && (
                          <Badge className="border-transparent bg-red-500/15 text-red-700 dark:text-red-400">
                            {overdue} เกินกำหนด
                          </Badge>
                        )}
                        {nextTask && (
                          <span className="truncate">
                            ถัดไป: {nextTask.name}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }
              )
            )}
          </div>

          {/* Right rail: critical + upcoming */}
          <div className="space-y-4">
            <Card className="gap-0 py-0">
              <CardHeader className="gap-0 border-b px-3 py-2.5">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="size-4 text-red-500" />
                  Critical / Urgent
                  <span className="ml-auto rounded-full bg-muted px-2 text-xs tabular-nums text-muted-foreground">
                    {critical.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-2">
                {critical.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    ไม่มีงานเร่งด่วน 🎉
                  </p>
                ) : (
                  <>
                    {critical.slice(0, 8).map(criticalRow)}
                    {critical.length > 8 && (
                      <p className="px-1 text-[11px] text-muted-foreground">
                        +{critical.length - 8} งานเพิ่มเติม
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="gap-0 py-0">
              <CardHeader className="gap-0 border-b px-3 py-2.5">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Rocket className="size-4 text-muted-foreground" />
                  Upcoming Releases
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                {upcomingReleases.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    ไม่มีกำหนดปล่อยเพลง
                  </p>
                ) : (
                  <ul className="divide-y">
                    {upcomingReleases.slice(0, 6).map((p) => {
                      const days = diffDays(today, parseDate(p.releaseDate));
                      return (
                        <li
                          key={p.id}
                          className="flex items-center gap-2 px-1 py-2"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">
                              {p.songName}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                              {p.artistName} · {p.label}
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="text-xs font-medium tabular-nums">
                              {formatShort(parseDate(p.releaseDate))}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {relLabel(days)}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Personal workspace */}
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
            {bucket("Overdue", myOverdue, "red")}
            {bucket("Due Today", myToday, "amber")}
            {bucket("Upcoming", myUpcoming, "default")}
          </div>
        )}
      </section>
    </div>
  );
}
