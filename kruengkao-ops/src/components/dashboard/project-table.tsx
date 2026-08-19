"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  FileText,
  Library,
  Link2,
  MoreHorizontal,
  Pencil,
  Plus,
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
import { TASK_GROUPS, packStatus, taskDeadline } from "@/lib/mock-data";
import {
  PROJECT_TYPES,
  projectTypeEmoji,
  projectTypeLabel,
} from "@/lib/constants";
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

function SubTaskRow({
  task,
  project,
  allTasks,
  onTaskUpdate,
  onEditTask,
}: {
  task: Task;
  project: Project;
  allTasks: Task[];
  onTaskUpdate: (taskId: string, patch: Partial<Task>) => void;
  onEditTask: (task: Task) => void;
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
          <button
            type="button"
            onClick={() => onEditTask(task)}
            className="truncate text-left hover:underline"
          >
            {task.name}
          </button>
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

/** A single task-category card: header + its sub-task rows + append button */
function GroupCard({
  title,
  groupTasks,
  project,
  allTasks,
  onTaskUpdate,
  onEditTask,
  onAddTask,
}: {
  title: TaskGroup;
  groupTasks: Task[];
  project: Project;
  allTasks: Task[];
  onTaskUpdate: (taskId: string, patch: Partial<Task>) => void;
  onEditTask: (task: Task) => void;
  /** Open the Create Custom Task modal pre-filled with this category. */
  onAddTask: (project: Project, category: TaskGroup) => void;
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
            onEditTask={onEditTask}
          />
        ))}
        {groupTasks.length === 0 && (
          <p className="px-3 py-2 text-xs text-muted-foreground">ยังไม่มีงาน</p>
        )}
      </div>
      {/* List-append: subtle, dashed, blends into the card footer. */}
      <button
        type="button"
        onClick={() => onAddTask(project, title)}
        className="flex w-full items-center justify-center gap-1.5 border-t border-dashed px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
      >
        <Plus className="size-3.5" />
        Add Task
      </button>
    </div>
  );
}

/** Expanded panel under a project row: one card per pipeline category */
function SubTaskPanel({
  project,
  tasks,
  onTaskUpdate,
  onEditTask,
  onAddTask,
}: {
  project: Project;
  tasks: Task[];
  onTaskUpdate: (taskId: string, patch: Partial<Task>) => void;
  onEditTask: (task: Task) => void;
  onAddTask: (project: Project, category: TaskGroup) => void;
}) {
  // Each category's tasks sorted chronologically by deadline (earliest first).
  const byDeadline = (a: Task, b: Task) =>
    taskDeadline(a, project).getTime() - taskDeadline(b, project).getTime();

  return (
    <div className="bg-muted/40 p-4">
      {/* All pipeline categories on one row. They never wrap; the row scrolls
          horizontally instead, and each column keeps a usable min width so the
          task cards don't get squished on narrow screens. */}
      <div className="scrollbar-subtle overflow-x-auto">
        <div className="flex w-full flex-nowrap items-start gap-6">
          {TASK_GROUPS.map((group) => (
            <div key={group} className="min-w-[320px] flex-1">
              <GroupCard
                title={group}
                groupTasks={tasks
                  .filter((t) => t.group === group)
                  .toSorted(byDeadline)}
                project={project}
                allTasks={tasks}
                onTaskUpdate={onTaskUpdate}
                onEditTask={onEditTask}
                onAddTask={onAddTask}
              />
            </div>
          ))}
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
  onEditTask,
  onAddTask,
}: {
  projects: Project[];
  tasks: Task[];
  onOpenDetails: (project: Project) => void;
  onTaskUpdate: (taskId: string, patch: Partial<Task>) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onEditTask: (task: Task) => void;
  onAddTask: (project: Project, category: TaskGroup) => void;
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

  // Group rows by lifecycle Status (default) or by Project Type.
  const [groupBy, setGroupBy] = React.useState<"status" | "type">("status");

  // Section collapse — keyed by section key (phase or type). Done starts folded.
  const [collapsed, setCollapsed] = React.useState<Set<string>>(
    () => new Set<string>(["Done"])
  );
  const toggleSection = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  interface Section {
    key: string;
    label: string;
    dot: string | null; // color dot (status) — types use an emoji in the label
    hint: string;
    projects: Project[];
  }

  // Bucket the (already release-date-sorted) projects for the active grouping.
  const sections = React.useMemo<Section[]>(() => {
    if (groupBy === "type") {
      const byType = new Map<string, Project[]>();
      for (const p of projects) {
        if (!byType.has(p.projectType)) byType.set(p.projectType, []);
        byType.get(p.projectType)!.push(p);
      }
      // Canonical type order (PROJECT_TYPES); unknown types sort last.
      const rank = (t: string) => {
        const i = (PROJECT_TYPES as readonly string[]).indexOf(t);
        return i === -1 ? PROJECT_TYPES.length : i;
      };
      return [...byType.keys()]
        .toSorted((a, b) => rank(a) - rank(b))
        .map((type) => ({
          key: type,
          label: projectTypeLabel(type),
          dot: null,
          hint: "",
          projects: byType.get(type)!,
        }));
    }

    const buckets: Record<ProjectPhase, Project[]> = {
      Ongoing: [],
      Todo: [],
      Done: [],
    };
    for (const p of projects) {
      const phase = projectPhase(tasks.filter((t) => t.projectId === p.id));
      buckets[phase].push(p);
    }
    return PHASES.map((ph) => ({
      key: ph.key,
      label: ph.label,
      dot: ph.dot,
      hint: ph.hint,
      projects: buckets[ph.key],
    }));
  }, [groupBy, projects, tasks]);

  return (
    <div className="space-y-3">
      {/* Group-by toggle — Status (lifecycle) vs Project Type */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Group by
        </span>
        <div className="inline-flex rounded-lg border p-0.5">
          {(["status", "type"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGroupBy(g)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                groupBy === g
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border">
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
            const isCollapsed = collapsed.has(section.key);
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
                      {isCollapsed ? (
                        <ChevronRight className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="size-4 text-muted-foreground" />
                      )}
                      {section.dot && (
                        <span
                          className={cn("size-2.5 rounded-full", section.dot)}
                        />
                      )}
                      <span className="text-sm font-semibold">
                        {section.label}
                      </span>
                      <span className="rounded-full bg-background px-2 text-xs tabular-nums text-muted-foreground">
                        {section.projects.length}
                      </span>
                      {section.hint && (
                        <span className="text-xs text-muted-foreground">
                          {section.hint}
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                {!isCollapsed &&
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
                      <div>
                        <div className="flex items-center gap-1.5 font-medium">
                          <span
                            title={project.projectType}
                            className="text-sm leading-none"
                          >
                            {projectTypeEmoji(project.projectType)}
                          </span>
                          {project.songName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {project.artistName} · {project.label}
                        </div>
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
                            aria-label="Digital Library"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link href={`/projects/${project.id}/digital-library`}>
                              <Library className="size-4" />
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Digital Library</TooltipContent>
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
                        onEditTask={onEditTask}
                        onAddTask={onAddTask}
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
      </div>

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
