"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Link2,
  TriangleAlert,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { initialsOf, taskDeadline, taskStart } from "@/lib/mock-data";
import type { Project, Task, TaskStatus } from "@/lib/types";

const BAR_STYLES: Record<TaskStatus, string> = {
  "Not Start": "border border-dashed border-muted-foreground/40 bg-muted",
  WIP: "bg-blue-500/80 hover:bg-blue-500",
  Done: "bg-emerald-500/70 hover:bg-emerald-500",
  Blocked: "bg-red-500/80 hover:bg-red-500",
};

const GROUP_DOTS: Record<string, string> = {
  "Digital Distribution Pack": "bg-violet-500",
  "TEASER & MV": "bg-amber-500",
};

const LABEL_W = "w-64"; // keep the header spacer and every row in sync

interface Range {
  start: Date;
  totalDays: number;
}

function pct(range: Range, date: Date): number {
  return (diffDays(range.start, date) / range.totalDays) * 100;
}

/** Faint vertical line at each month boundary, drawn behind a row's bars. */
function MonthGrid({
  months,
}: {
  months: { label: string; left: number }[];
}) {
  return (
    <>
      {months.map((m, i) =>
        i === 0 ? null : (
          <div
            key={m.label}
            className="absolute inset-y-0 w-px bg-border/60"
            style={{ left: `${m.left}%` }}
          />
        )
      )}
    </>
  );
}

function TaskBar({
  task,
  project,
  range,
  allTasks,
  onEdit,
}: {
  task: Task;
  project: Project;
  range: Range;
  allTasks: Task[];
  onEdit: () => void;
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
        <button
          type="button"
          onClick={onEdit}
          aria-label={`แก้ไข ${task.name}`}
          className={cn(
            "absolute top-1/2 h-5 -translate-y-1/2 cursor-pointer rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
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
            {formatShort(start)} → {formatShort(deadline)}
          </div>
          <div className="text-xs">
            PIC: {assignee} · สถานะ: {task.status}
            {overdue && " · เลยกำหนด!"}
          </div>
          {blocker && <div className="text-xs">รองาน: {blocker.name}</div>}
          <div className="pt-0.5 text-[10px] text-muted-foreground">
            คลิกเพื่อแก้ไข
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function monthSegments(range: Range) {
  const segments: { label: string; left: number; width: number }[] = [];
  let cursor = new Date(range.start.getFullYear(), range.start.getMonth(), 1);
  const end = addDays(range.start, range.totalDays);
  const monthFmt = new Intl.DateTimeFormat("th-TH", {
    month: "short",
    year: "2-digit",
  });

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
  onEditTask,
}: {
  projects: Project[];
  tasks: Task[];
  onEditTask: (task: Task) => void;
}) {
  const today = React.useSyncExternalStore(
    subscribeNoop,
    getClientToday,
    getServerToday
  );

  const [collapsed, setCollapsed] = React.useState<Set<string>>(
    () => new Set()
  );
  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allCollapsed =
    projects.length > 0 && projects.every((p) => collapsed.has(p.id));
  const toggleAll = () =>
    setCollapsed(allCollapsed ? new Set() : new Set(projects.map((p) => p.id)));

  const range: Range | null = React.useMemo(() => {
    if (projects.length === 0) return null;
    const starts = projects.flatMap((p) =>
      tasks.filter((t) => t.projectId === p.id).map((t) => taskStart(t, p))
    );
    const ends = projects.flatMap((p) =>
      tasks.filter((t) => t.projectId === p.id).map((t) => taskDeadline(t, p))
    );
    const releases = projects.map((p) => parseDate(p.releaseDate));
    // Include releases so the range is valid even for task-less projects, and
    // ends so edited deadlines past the release date still fit.
    const minMs = Math.min(...[...starts, ...releases].map((d) => d.getTime()));
    const maxMs = Math.max(...[...ends, ...releases].map((d) => d.getTime()));
    const min = addDays(new Date(minMs), -4);
    const max = addDays(new Date(maxMs), 8);
    return { start: min, totalDays: Math.max(diffDays(min, max), 1) };
  }, [projects, tasks]);

  if (!range) {
    return (
      <div className="flex items-center justify-center rounded-xl border p-12 text-sm text-muted-foreground">
        ไม่มีโปรเจกต์ในสังกัดนี้
      </div>
    );
  }

  const months = monthSegments(range);
  const taskCount = tasks.filter((t) =>
    projects.some((p) => p.id === t.projectId)
  ).length;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground tabular-nums">
          {projects.length} โปรเจกต์ · {taskCount} งาน
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleAll}
          disabled={projects.length === 0}
        >
          {allCollapsed ? (
            <ChevronsUpDown data-icon="inline-start" />
          ) : (
            <ChevronsDownUp data-icon="inline-start" />
          )}
          {allCollapsed ? "Expand All" : "Collapse All"}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <div className="min-w-[64rem]">
          {/* Month header */}
          <div className="flex border-b bg-muted/50">
            <div
              className={cn(
                LABEL_W,
                "shrink-0 border-r px-3 py-2 text-sm font-medium"
              )}
            >
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
            const projectTasks = tasks.filter(
              (t) => t.projectId === project.id
            );
            const releasePct = pct(range, parseDate(project.releaseDate));
            const isCollapsed = collapsed.has(project.id);
            const doneCount = projectTasks.filter(
              (t) => t.status === "Done"
            ).length;
            return (
              <div key={project.id} className="border-b last:border-b-0">
                {/* Project header row with release-date marker */}
                <div className="flex bg-muted/30">
                  <div
                    className={cn(
                      LABEL_W,
                      "flex shrink-0 items-start gap-1.5 border-r px-2 py-2"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggle(project.id)}
                      aria-label={isCollapsed ? "กางงาน" : "ย่องาน"}
                      aria-expanded={!isCollapsed}
                      className="mt-0.5 rounded p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">
                        {project.songName}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {project.artistName} ({project.label}) · ปล่อย{" "}
                        {formatFull(parseDate(project.releaseDate))}
                      </div>
                    </div>
                    {projectTasks.length > 0 && (
                      <span className="ml-auto shrink-0 self-center rounded-full bg-background px-2 text-xs tabular-nums text-muted-foreground">
                        {doneCount}/{projectTasks.length}
                      </span>
                    )}
                  </div>
                  <div className="relative flex-1">
                    <MonthGrid months={months} />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="absolute top-1/2 z-10 size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 cursor-pointer rounded-[2px] bg-foreground"
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
                {!isCollapsed &&
                  projectTasks.map((task) => {
                    const deadline = taskDeadline(task, project);
                    const overdue =
                      today !== null &&
                      deadline < today &&
                      task.status !== "Done";
                    return (
                      <div key={task.id} className="flex hover:bg-muted/30">
                        <div
                          className={cn(
                            LABEL_W,
                            "flex shrink-0 items-center gap-2 border-r py-1.5 pr-2 pl-8"
                          )}
                        >
                          <span
                            className={cn(
                              "size-2 shrink-0 rounded-full",
                              GROUP_DOTS[task.group]
                            )}
                          />
                          <button
                            type="button"
                            onClick={() => onEditTask(task)}
                            className="truncate text-left text-xs hover:underline"
                          >
                            {task.name}
                          </button>
                          {task.blockedBy && (
                            <Link2 className="size-3 shrink-0 text-muted-foreground" />
                          )}
                          {overdue && (
                            <TriangleAlert className="size-3 shrink-0 text-red-500" />
                          )}
                          {task.person && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Avatar className="ml-auto size-4 shrink-0">
                                  <AvatarFallback className="text-[8px]">
                                    {initialsOf(task.person)}
                                  </AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent>
                                {task.person} ({task.role})
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <div className="relative h-8 flex-1">
                          <MonthGrid months={months} />
                          <div
                            className="absolute inset-y-0 w-px bg-foreground/10"
                            style={{ left: `${releasePct}%` }}
                          />
                          {today !== null && (
                            <div
                              className="absolute inset-y-0 z-10 w-px bg-red-500/60"
                              style={{ left: `${pct(range, today)}%` }}
                            />
                          )}
                          <TaskBar
                            task={task}
                            project={project}
                            range={range}
                            allTasks={projectTasks}
                            onEdit={() => onEditTask(task)}
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
              <span className="h-2.5 w-5 rounded-sm border border-dashed border-muted-foreground/40 bg-muted" />{" "}
              Not Start
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-5 rounded-sm bg-blue-500/80" /> WIP
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-5 rounded-sm bg-emerald-500/70" /> Done
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-5 rounded-sm bg-red-500/80" /> Blocked /
              Delayed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rotate-45 rounded-[2px] bg-foreground" />{" "}
              Release Date
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-px bg-red-500/60" /> วันนี้
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
