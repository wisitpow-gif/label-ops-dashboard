"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  FileText,
  Inbox,
  Link2,
  MoreHorizontal,
  Pencil,
  Trash2,
  TriangleAlert,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatFull, formatShort, parseDate, startOfToday } from "@/lib/dates";
import { TASK_GROUPS, initialsOf, packStatus, taskDeadline } from "@/lib/mock-data";
import type { Project, Task, TaskGroup } from "@/lib/types";
import { StatusBadge } from "./status-badge";
import { AssigneeSelect, StatusSelect } from "./task-controls";

/** Pack-level summary cell: rolled-up status + done/total progress */
function PackCell({ tasks }: { tasks: Task[] }) {
  const status = packStatus(tasks);
  const done = tasks.filter((t) => t.status === "Done").length;
  return (
    <div className="flex flex-col items-start gap-1.5">
      <StatusBadge status={status} />
      <div className="flex w-24 items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full",
              status === "Blocked" ? "bg-red-500" : "bg-emerald-500"
            )}
            style={{ width: `${tasks.length ? (done / tasks.length) * 100 : 0}%` }}
          />
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">
          {done}/{tasks.length}
        </span>
      </div>
    </div>
  );
}

interface PersonLoad {
  person: string;
  total: number;
  done: number;
  overdue: number;
}

/**
 * Per-assignee workload chips for a project row: each person's cleared/total,
 * sorted with the most-queuing first. Shows how work is distributed and who is
 * backed up — the full cleared/queuing/overdue breakdown is in the tooltip.
 */
function TeamWorkloadStrip({
  tasks,
  project,
}: {
  tasks: Task[];
  project: Project;
}) {
  const today = startOfToday();
  const { loads, unassigned } = React.useMemo(() => {
    const map = new Map<string, PersonLoad>();
    let unassigned = 0;
    for (const t of tasks) {
      if (!t.person) {
        unassigned += 1;
        continue;
      }
      const s =
        map.get(t.person) ??
        { person: t.person, total: 0, done: 0, overdue: 0 };
      s.total += 1;
      if (t.status === "Done") s.done += 1;
      else if (taskDeadline(t, project) < today) s.overdue += 1;
      map.set(t.person, s);
    }
    const loads = [...map.values()].sort(
      (a, b) =>
        b.total - b.done - (a.total - a.done) || // most queuing first
        b.total - a.total ||
        a.person.localeCompare(b.person)
    );
    return { loads, unassigned };
  }, [tasks, project, today]);

  if (loads.length === 0 && unassigned === 0) return null;

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      {loads.map((l) => {
        const queuing = l.total - l.done;
        const cleared = queuing === 0;
        return (
          <Tooltip key={l.person}>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] font-medium",
                  l.overdue > 0
                    ? "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400"
                    : cleared
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "bg-background text-foreground/80"
                )}
              >
                <Avatar className="size-4">
                  <AvatarFallback className="text-[8px]">
                    {initialsOf(l.person)}
                  </AvatarFallback>
                </Avatar>
                <span className="tabular-nums">
                  {l.done}/{l.total}
                </span>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <span className="font-medium">{l.person}</span> — {l.done} เสร็จ ·{" "}
              {queuing} ค้าง
              {l.overdue > 0 ? ` · ${l.overdue} เกินกำหนด` : ""}
            </TooltipContent>
          </Tooltip>
        );
      })}
      {unassigned > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1 rounded-full border border-dashed px-1.5 py-0.5 text-[11px] text-muted-foreground">
              <span className="flex size-4 items-center justify-center rounded-full border border-dashed text-[8px]">
                ?
              </span>
              <span className="tabular-nums">{unassigned}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent>{unassigned} งานยังไม่ได้มอบหมาย</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

function SubTaskRow({
  task,
  project,
  allTasks,
  onTaskUpdate,
}: {
  task: Task;
  project: Project;
  allTasks: Task[];
  onTaskUpdate: (taskId: string, patch: Partial<Task>) => void;
}) {
  const deadline = taskDeadline(task, project);
  const overdue = deadline < startOfToday() && task.status !== "Done";
  const blocker = task.blockedBy
    ? allTasks.find((t) => t.id === task.blockedBy)
    : undefined;

  return (
    <div className="space-y-1 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5 text-sm">
          <span className="truncate">{task.name}</span>
          {blocker && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>รองาน: {blocker.name}</TooltipContent>
            </Tooltip>
          )}
        </div>
        <StatusSelect
          value={task.status}
          onChange={(status) => onTaskUpdate(task.id, { status })}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <div
          className={cn(
            "flex items-center gap-1.5 text-xs tabular-nums",
            overdue
              ? "font-medium text-red-600 dark:text-red-400"
              : "text-muted-foreground"
          )}
        >
          {overdue && <TriangleAlert className="size-3.5" />}
          {formatShort(deadline)}
          <span className="text-muted-foreground">(T-{task.tMinusDays})</span>
        </div>
        <AssigneeSelect
          role={task.role}
          person={task.person}
          onChange={(patch) => onTaskUpdate(task.id, patch)}
        />
      </div>
    </div>
  );
}

/** A single task-category card: header + its sub-task rows */
function GroupCard({
  title,
  groupTasks,
  project,
  allTasks,
  onTaskUpdate,
}: {
  title: TaskGroup;
  groupTasks: Task[];
  project: Project;
  allTasks: Task[];
  onTaskUpdate: (taskId: string, patch: Partial<Task>) => void;
}) {
  return (
    <div className="h-fit overflow-hidden rounded-lg border bg-background">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-sm font-medium">{title}</span>
        <StatusBadge status={packStatus(groupTasks)} />
      </div>
      <div className="divide-y">
        {groupTasks.map((task) => (
          <SubTaskRow
            key={task.id}
            task={task}
            project={project}
            allTasks={allTasks}
            onTaskUpdate={onTaskUpdate}
          />
        ))}
      </div>
    </div>
  );
}

/** Expanded panel under a project row: two explicit side-by-side columns */
function SubTaskPanel({
  project,
  tasks,
  onTaskUpdate,
}: {
  project: Project;
  tasks: Task[];
  onTaskUpdate: (taskId: string, patch: Partial<Task>) => void;
}) {
  // Split the tasks into the two categories up front (no shared loop) so the
  // left/right column structure is explicit and guaranteed.
  const digitalTasks = tasks.filter((t) => t.group === "Digital Distribution Pack");
  const teaserTasks = tasks.filter((t) => t.group === "TEASER & MV");

  return (
    <div className="bg-muted/40 p-4">
      <div className="grid w-full grid-cols-1 items-start gap-8 md:grid-cols-2">
        {/* LEFT COLUMN — Digital Distribution Pack */}
        <div>
          <GroupCard
            title="Digital Distribution Pack"
            groupTasks={digitalTasks}
            project={project}
            allTasks={tasks}
            onTaskUpdate={onTaskUpdate}
          />
        </div>

        {/* RIGHT COLUMN — TEASER & MV */}
        <div>
          <GroupCard
            title="TEASER & MV"
            groupTasks={teaserTasks}
            project={project}
            allTasks={tasks}
            onTaskUpdate={onTaskUpdate}
          />
        </div>
      </div>
    </div>
  );
}

type ProjectPhase = "Ongoing" | "Todo" | "Done";

/** Roll a project's task statuses up to one of three lifecycle phases. */
function projectPhase(projectTasks: Task[]): ProjectPhase {
  if (projectTasks.length === 0) return "Todo";
  if (projectTasks.every((t) => t.status === "Done")) return "Done";
  if (projectTasks.every((t) => t.status === "Not Start")) return "Todo";
  return "Ongoing";
}

// Section order + styling. Ongoing (actionable) first, Done last.
const PHASES: {
  key: ProjectPhase;
  label: string;
  dot: string;
  hint: string;
}[] = [
  { key: "Ongoing", label: "Ongoing", dot: "bg-blue-500", hint: "กำลังดำเนินการ" },
  { key: "Todo", label: "Todo", dot: "bg-muted-foreground/40", hint: "ยังไม่เริ่ม" },
  { key: "Done", label: "Done", dot: "bg-emerald-500", hint: "เสร็จแล้ว" },
];

export function ProjectTable({
  projects,
  tasks,
  onOpenDetails,
  onTaskUpdate,
  onEditProject,
  onDeleteProject,
}: {
  projects: Project[];
  tasks: Task[];
  onOpenDetails: (project: Project) => void;
  onTaskUpdate: (taskId: string, patch: Partial<Task>) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
}) {
  const [expanded, setExpanded] = React.useState<Set<string>>(
    () => new Set(["1"])
  );
  const [deleteTarget, setDeleteTarget] = React.useState<Project | null>(null);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Done starts collapsed so the view opens focused on actionable work.
  const [collapsedSections, setCollapsedSections] = React.useState<
    Set<ProjectPhase>
  >(() => new Set<ProjectPhase>(["Done"]));
  const toggleSection = (key: ProjectPhase) =>
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  // Bucket the (already release-date-sorted) projects by lifecycle phase.
  const sections = React.useMemo(() => {
    const buckets: Record<ProjectPhase, Project[]> = {
      Ongoing: [],
      Todo: [],
      Done: [],
    };
    for (const p of projects) {
      const phase = projectPhase(tasks.filter((t) => t.projectId === p.id));
      buckets[phase].push(p);
    }
    return PHASES.map((ph) => ({ ...ph, projects: buckets[ph.key] }));
  }, [projects, tasks]);

  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-36">Release Date</TableHead>
            <TableHead>Song Name</TableHead>
            {TASK_GROUPS.map((group) => (
              <TableHead key={group} className="w-48">
                {group}
              </TableHead>
            ))}
            <TableHead className="w-12" />
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={TASK_GROUPS.length + 4}
                className="py-12 text-center text-sm text-muted-foreground"
              >
                ไม่มีโปรเจกต์ในสังกัดนี้
              </TableCell>
            </TableRow>
          )}
          {sections.map((section) => {
            if (section.projects.length === 0) return null;
            const collapsed = collapsedSections.has(section.key);
            return (
              <React.Fragment key={`section-${section.key}`}>
                <TableRow
                  className="border-t-2 bg-muted/40 hover:bg-muted/40"
                  onClick={() => toggleSection(section.key)}
                >
                  <TableCell
                    colSpan={TASK_GROUPS.length + 4}
                    className="cursor-pointer py-2"
                  >
                    <div className="flex items-center gap-2">
                      {collapsed ? (
                        <ChevronRight className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="size-4 text-muted-foreground" />
                      )}
                      <span
                        className={cn("size-2.5 rounded-full", section.dot)}
                      />
                      <span className="text-sm font-semibold">
                        {section.label}
                      </span>
                      <span className="rounded-full bg-background px-2 text-xs tabular-nums text-muted-foreground">
                        {section.projects.length}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {section.hint}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
                {!collapsed &&
                  section.projects.map((project) => {
                    const projectTasks = tasks.filter(
                      (t) => t.projectId === project.id
                    );
                    const isOpen = expanded.has(project.id);
                    return (
                      <React.Fragment key={project.id}>
                <TableRow
                  className="cursor-pointer"
                  onClick={() => toggle(project.id)}
                >
                  <TableCell className="text-sm tabular-nums">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <CalendarDays className="size-3.5" />
                      {formatFull(parseDate(project.releaseDate))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        aria-label={isOpen ? "ย่องานย่อย" : "กางงานย่อย"}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggle(project.id);
                        }}
                      >
                        {isOpen ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronRight className="size-4" />
                        )}
                      </Button>
                      <div className="min-w-0">
                        <div className="font-medium">{project.songName}</div>
                        <div className="text-xs text-muted-foreground">
                          {project.artistName} · {project.label}
                        </div>
                        <TeamWorkloadStrip
                          tasks={projectTasks}
                          project={project}
                        />
                      </div>
                    </div>
                  </TableCell>
                  {TASK_GROUPS.map((group) => (
                    <TableCell key={group}>
                      <PackCell
                        tasks={projectTasks.filter((t) => t.group === group)}
                      />
                    </TableCell>
                  ))}
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground"
                          aria-label="เปิดรายละเอียดโปรเจกต์"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDetails(project);
                          }}
                        >
                          <FileText className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Project Details</TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-0.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground"
                            aria-label="Ingest Hub"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link href={`/projects/${project.id}/ingest`}>
                              <Inbox className="size-4" />
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Ingest Hub</TooltipContent>
                      </Tooltip>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground"
                            aria-label="เมนูการจัดการโปรเจกต์"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenuItem
                          onSelect={() =>
                            // defer until the menu has closed so the menu's
                            // focus scope doesn't clash with the dialog's
                            setTimeout(() => onEditProject(project), 0)
                          }
                        >
                          <Pencil />
                          Edit Project
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() =>
                            setTimeout(() => setDeleteTarget(project), 0)
                          }
                        >
                          <Trash2 />
                          Delete Project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
                {isOpen && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={TASK_GROUPS.length + 4} className="p-0">
                      <SubTaskPanel
                        project={project}
                        tasks={projectTasks}
                        onTaskUpdate={onTaskUpdate}
                      />
                    </TableCell>
                  </TableRow>
                )}
                      </React.Fragment>
                    );
                  })}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent
          // Don't return focus to the row's menu trigger — it unmounts when
          // the project is deleted (avoids a Radix focus-scope dispatchEvent crash).
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              project and all associated tasks, timeline data, and financial
              records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                buttonVariants({ variant: "destructive" }),
                "bg-destructive text-white hover:bg-destructive/90"
              )}
              onClick={() => {
                if (deleteTarget) onDeleteProject(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
