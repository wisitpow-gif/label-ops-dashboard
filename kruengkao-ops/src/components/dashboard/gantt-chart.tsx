"use client";

import * as React from "react";
import { Link2, TriangleAlert } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  addDays,
  diffDays,
  formatFull,
  formatShort,
  parseDate,
  startOfToday,
} from "@/lib/dates";
import { taskDeadline, taskStart } from "@/lib/mock-data";
import type { Project, Task, TaskStatus } from "@/lib/types";

// TODO(Phase 2): drag & drop to adjust start/end dates + SVG dependency
// connectors. This scaffold renders the static timeline layout only.

const BAR_STYLES: Record<TaskStatus, string> = {
  "Not Start": "border border-dashed border-muted-foreground/40 bg-muted",
  WIP: "bg-blue-500/80",
  Done: "bg-emerald-500/70",
  Blocked: "bg-red-500/80",
};

const GROUP_DOTS: Record<string, string> = {
  "Digital Distribution Pack": "bg-violet-500",
  "TEASER & MV": "bg-amber-500",
};

interface Range {
  start: Date;
  totalDays: number;
}

function pct(range: Range, date: Date): number {
  return (diffDays(range.start, date) / range.totalDays) * 100;
}

function TaskBar({
  task,
  project,
  range,
  allTasks,
}: {
  task: Task;
  project: Project;
  range: Range;
  allTasks: Task[];
}) {
  const start = taskStart(task, project);
  const deadline = taskDeadline(task, project);
  const overdue = deadline < startOfToday() && task.status !== "Done";
  const assignee = task.person ? `${task.person} (${task.role})` : task.role;
  const blocker = task.blockedBy
    ? allTasks.find((t) => t.id === task.blockedBy)
    : undefined;

  const left = pct(range, start);
  const width = Math.max(pct(range, deadline) - left, 1);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "absolute top-1/2 h-5 -translate-y-1/2 cursor-pointer rounded-md transition-opacity hover:opacity-80",
            BAR_STYLES[task.status],
            overdue && "ring-2 ring-red-500"
          )}
          style={{ left: `${left}%`, width: `${width}%` }}
        />
      </TooltipTrigger>
      <TooltipContent className="max-w-60">
        <div className="space-y-1">
          <div className="font-medium">{task.name}</div>
          <div className="text-xs">
            {formatShort(start)} → {formatShort(deadline)} (T-{task.tMinusDays})
          </div>
          <div className="text-xs">
            PIC: {assignee} · สถานะ: {task.status}
            {overdue && " · เลยกำหนด!"}
          </div>
          {blocker && <div className="text-xs">รองาน: {blocker.name}</div>}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function monthSegments(range: Range) {
  const segments: { label: string; left: number; width: number }[] = [];
  let cursor = new Date(range.start.getFullYear(), range.start.getMonth(), 1);
  const end = addDays(range.start, range.totalDays);
  const monthFmt = new Intl.DateTimeFormat("th-TH", { month: "short", year: "2-digit" });

  while (cursor < end) {
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    const segStart = cursor < range.start ? range.start : cursor;
    const segEnd = next > end ? end : next;
    segments.push({
      label: monthFmt.format(cursor),
      left: pct(range, segStart),
      width: pct(range, segEnd) - pct(range, segStart),
    });
    cursor = next;
  }
  return segments;
}

// Today is resolved on the client only (server snapshot = null) so SSR/client
// clock differences can't cause a hydration mismatch.
let cachedToday: Date | null = null;
const subscribeNoop = () => () => {};
const getClientToday = () => (cachedToday ??= startOfToday());
const getServerToday = () => null;

export function GanttChart({
  projects,
  tasks,
}: {
  projects: Project[];
  tasks: Task[];
}) {
  const today = React.useSyncExternalStore(
    subscribeNoop,
    getClientToday,
    getServerToday
  );

  const range: Range | null = React.useMemo(() => {
    if (projects.length === 0) return null;
    const starts = projects.flatMap((p) =>
      tasks
        .filter((t) => t.projectId === p.id)
        .map((t) => taskStart(t, p))
    );
    const releases = projects.map((p) => parseDate(p.releaseDate));
    const min = addDays(new Date(Math.min(...starts.map((d) => d.getTime()))), -4);
    const max = addDays(new Date(Math.max(...releases.map((d) => d.getTime()))), 8);
    return { start: min, totalDays: diffDays(min, max) };
  }, [projects, tasks]);

  if (!range) {
    return (
      <div className="flex items-center justify-center rounded-xl border p-12 text-sm text-muted-foreground">
        ไม่มีโปรเจกต์ในสังกัดนี้
      </div>
    );
  }

  const months = monthSegments(range);

  return (
    <div className="overflow-x-auto rounded-xl border">
      <div className="min-w-225">
        {/* Month header */}
        <div className="flex border-b bg-muted/50">
          <div className="w-56 shrink-0 border-r px-3 py-2 text-sm font-medium">
            Project / Task
          </div>
          <div className="relative h-9 flex-1">
            {months.map((m) => (
              <div
                key={m.label}
                className="absolute top-0 flex h-full items-center border-r px-2 text-xs text-muted-foreground"
                style={{ left: `${m.left}%`, width: `${m.width}%` }}
              >
                {m.label}
              </div>
            ))}
          </div>
        </div>

        {projects.map((project) => {
          const projectTasks = tasks.filter((t) => t.projectId === project.id);
          const releasePct = pct(range, parseDate(project.releaseDate));
          return (
            <div key={project.id} className="border-b last:border-b-0">
              {/* Project header row with release-date marker */}
              <div className="flex bg-muted/30">
                <div className="w-56 shrink-0 border-r px-3 py-2">
                  <div className="text-sm font-semibold">{project.songName}</div>
                  <div className="text-xs text-muted-foreground">
                    {project.artistName} ({project.label}) · ปล่อย{" "}
                    {formatFull(parseDate(project.releaseDate))}
                  </div>
                </div>
                <div className="relative flex-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 cursor-pointer rounded-[2px] bg-foreground"
                        style={{ left: `${releasePct}%` }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      Release: {formatFull(parseDate(project.releaseDate))}
                    </TooltipContent>
                  </Tooltip>
                  <div
                    className="absolute inset-y-0 w-px bg-foreground/20"
                    style={{ left: `${releasePct}%` }}
                  />
                </div>
              </div>

              {/* Task rows */}
              {projectTasks.map((task) => {
                const deadline = taskDeadline(task, project);
                const overdue =
                  today !== null && deadline < today && task.status !== "Done";
                return (
                  <div key={task.id} className="flex hover:bg-muted/30">
                    <div className="flex w-56 shrink-0 items-center gap-2 border-r px-3 py-1.5">
                      <span
                        className={cn(
                          "size-2 shrink-0 rounded-full",
                          GROUP_DOTS[task.group]
                        )}
                      />
                      <span className="truncate text-xs">{task.name}</span>
                      {task.blockedBy && (
                        <Link2 className="size-3 shrink-0 text-muted-foreground" />
                      )}
                      {overdue && (
                        <TriangleAlert className="size-3 shrink-0 text-red-500" />
                      )}
                    </div>
                    <div className="relative h-8 flex-1">
                      {/* release line continued through task rows */}
                      <div
                        className="absolute inset-y-0 w-px bg-foreground/10"
                        style={{ left: `${releasePct}%` }}
                      />
                      {today !== null && (
                        <div
                          className="absolute inset-y-0 w-px bg-red-500/60"
                          style={{ left: `${pct(range, today)}%` }}
                        />
                      )}
                      <TaskBar
                        task={task}
                        project={project}
                        range={range}
                        allTasks={projectTasks}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 border-t bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-5 rounded-sm border border-dashed border-muted-foreground/40 bg-muted" /> Not Start
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-5 rounded-sm bg-blue-500/80" /> WIP
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-5 rounded-sm bg-emerald-500/70" /> Done
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-5 rounded-sm bg-red-500/80" /> Blocked / Delayed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rotate-45 rounded-[2px] bg-foreground" /> Release Date
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-px bg-red-500/60" /> วันนี้
          </span>
        </div>
      </div>
    </div>
  );
}
