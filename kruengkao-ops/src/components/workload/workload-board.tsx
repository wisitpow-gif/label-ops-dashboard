"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  GripVertical,
  Lock,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatShort, parseDate, startOfToday, toISODate } from "@/lib/dates";
import {
  TEAM_STRUCTURE,
  UNASSIGNED,
  initialsOf,
  membersOfRole,
  taskDeadline,
} from "@/lib/mock-data";
import type { Project, Task, TaskDependency } from "@/lib/types";
import { updateTask } from "@/app/actions";
import { StatusSelect, AssigneeSelect } from "@/components/dashboard/task-controls";

// ---------------------------------------------------------------------------
// People columns: every distinct staff member across all roles, in team order,
// preceded by an "Unassigned" bucket for tasks with no person yet.
// (A person can belong to more than one role — e.g. "Ken" — so we de-dupe.)
// ---------------------------------------------------------------------------
const PEOPLE: string[] = (() => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const g of TEAM_STRUCTURE) {
    for (const m of g.members) {
      if (!seen.has(m)) {
        seen.add(m);
        out.push(m);
      }
    }
  }
  return out;
})();

const COLUMNS: { key: string; label: string }[] = [
  { key: UNASSIGNED, label: "Unassigned" },
  ...PEOPLE.map((p) => ({ key: p, label: p })),
];

/** Role to record when reassigning to `person`: keep the current one if it
 *  already contains them, else fall back to their first home role. */
function roleForPerson(person: string, currentRole: string): string {
  if (membersOfRole(currentRole).includes(person)) return currentRole;
  const g = TEAM_STRUCTURE.find((grp) => grp.members.includes(person));
  return g ? g.role : currentRole;
}

/** Effective date for a task: explicit due date (Internal) or the workback
 *  deadline derived from the release date (Release). Null when neither exists. */
function taskDate(task: Task, project: Project): Date | null {
  if (task.dueDate) return parseDate(task.dueDate);
  if (project.releaseDate) return taskDeadline(task, project);
  return null;
}

const WORK_CHIP: Record<string, string> = {
  Release: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  Internal: "bg-amber-500/15 text-amber-700 dark:text-amber-500",
};

function TaskCard({
  task,
  project,
  date,
  overdue,
  disableDone,
  isDragging,
  onDragStart,
  onDragEnd,
  onStatusChange,
  onAssigneeChange,
}: {
  task: Task;
  project: Project;
  date: Date | null;
  overdue: boolean;
  disableDone: boolean;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, cardEl: HTMLElement | null) => void;
  onDragEnd: () => void;
  onStatusChange: (next: Task["status"]) => void;
  onAssigneeChange: (patch: { role: string; person: string }) => void;
}) {
  const cardRef = React.useRef<HTMLDivElement>(null);

  return (
    <div
      ref={cardRef}
      className={cn(
        "rounded-lg border bg-background p-3 shadow-sm transition",
        isDragging && "opacity-40"
      )}
    >
      {/* Task name — the dominant block on a workload card */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold leading-snug">{task.name}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <span className="truncate text-xs text-muted-foreground">
              {project.songName}
            </span>
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide",
                WORK_CHIP[project.workType] ?? "bg-muted text-muted-foreground"
              )}
            >
              {project.workType === "Internal"
                ? "Internal"
                : project.label || "Release"}
            </span>
          </div>
        </div>
        {/* Drag handle — only this initiates the drag, so the inline
            controls inside the card stay clickable */}
        <button
          type="button"
          draggable
          onDragStart={(e) => onDragStart(e, cardRef.current)}
          onDragEnd={onDragEnd}
          aria-label="ลากเพื่อมอบหมายใหม่"
          className="shrink-0 cursor-grab text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>
      </div>

      {/* Date + status */}
      <div className="mt-2 flex items-center justify-between gap-2 border-t pt-2">
        <StatusSelect
          value={task.status}
          onChange={onStatusChange}
          disableDone={disableDone}
          disableDoneReason="prerequisites ยังไม่เสร็จ"
        />
        {date ? (
          <span
            className={cn(
              "flex items-center gap-1 text-sm font-semibold tabular-nums",
              overdue ? "text-red-600 dark:text-red-400" : "text-foreground/80"
            )}
          >
            {overdue ? (
              <AlertTriangle className="size-3.5" />
            ) : (
              <CalendarDays className="size-3.5" />
            )}
            {formatShort(date)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">ไม่มีกำหนด</span>
        )}
      </div>

      {/* Reassign without dragging (accessible fallback) */}
      <div className="mt-2 flex items-center gap-1.5">
        {disableDone && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-amber-600 dark:text-amber-500">
                <Lock className="size-3.5" />
              </span>
            </TooltipTrigger>
            <TooltipContent>ยังทำ Done ไม่ได้ — prerequisites ยังไม่เสร็จ</TooltipContent>
          </Tooltip>
        )}
        <div className="min-w-0 flex-1">
          <AssigneeSelect
            role={task.role}
            person={task.person}
            onChange={onAssigneeChange}
          />
        </div>
      </div>
    </div>
  );
}

export function WorkloadBoard({
  initialProjects,
  initialTasks,
  initialDependencies,
}: {
  initialProjects: Project[];
  initialTasks: Task[];
  initialDependencies: TaskDependency[];
}) {
  const [tasks, setTasks] = React.useState<Task[]>(initialTasks);
  // Projects & dependencies are read-only on this view.
  const projects = initialProjects;
  const dependencies = initialDependencies;

  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [overColumn, setOverColumn] = React.useState<string | null>(null);
  const [hideDone, setHideDone] = React.useState(false);
  const [hideEmpty, setHideEmpty] = React.useState(false);

  const projectById = React.useMemo(() => {
    const map = new Map<string, Project>();
    projects.forEach((p) => map.set(p.id, p));
    return map;
  }, [projects]);

  // Fast status lookup for the hard-gate check.
  const statusById = React.useMemo(() => {
    const map = new Map<string, Task["status"]>();
    tasks.forEach((t) => map.set(t.id, t.status));
    return map;
  }, [tasks]);

  // Tasks gated by unfinished prerequisites can't be marked Done.
  const unmetCountByTask = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const dep of dependencies) {
      if (statusById.get(dep.dependsOnTaskId) !== "Done") {
        map.set(dep.taskId, (map.get(dep.taskId) ?? 0) + 1);
      }
    }
    return map;
  }, [dependencies, statusById]);

  // Persist a task change optimistically; roll back + toast on failure
  // (also catches the server-side hard-gate backstop).
  const handleTaskUpdate = React.useCallback(
    (taskId: string, patch: Partial<Task>) => {
      let previous: Task | undefined;
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskId) {
            previous = t;
            return { ...t, ...patch };
          }
          return t;
        })
      );

      updateTask(taskId, {
        status: patch.status,
        role: patch.role,
        person: patch.person,
      }).catch((err) => {
        console.error("Failed to update task", err);
        if (previous) {
          const restore = previous;
          setTasks((cur) => cur.map((t) => (t.id === taskId ? restore : t)));
        }
        toast.error("บันทึกการเปลี่ยนแปลงไม่สำเร็จ", {
          description: "เปลี่ยนกลับเป็นค่าเดิมแล้ว — กรุณาลองอีกครั้ง",
        });
      });
    },
    []
  );

  // All visible tasks (only those whose project we actually loaded), sorted by
  // effective date ascending — undated tasks sink to the bottom.
  const visibleTasks = React.useMemo(() => {
    const dateKey = (t: Task) => {
      const p = projectById.get(t.projectId);
      const d = p ? taskDate(t, p) : null;
      return d ? toISODate(d) : "9999-12-31";
    };
    return tasks
      .filter((t) => projectById.has(t.projectId))
      .filter((t) => !(hideDone && t.status === "Done"))
      .sort((a, b) => dateKey(a).localeCompare(dateKey(b)));
  }, [tasks, projectById, hideDone]);

  const today = startOfToday();

  function tasksForColumn(key: string) {
    return visibleTasks.filter((t) => (t.person || UNASSIGNED) === key);
  }

  function handleDrop(e: React.DragEvent, columnKey: string) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    setOverColumn(null);
    setDraggingId(null);
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (columnKey === UNASSIGNED) {
      if (!task.person) return; // already unassigned
      handleTaskUpdate(taskId, { person: "" });
    } else {
      if (task.person === columnKey) return; // dropped on its own column
      handleTaskUpdate(taskId, {
        person: columnKey,
        role: roleForPerson(columnKey, task.role),
      });
    }
  }

  // Per-column stats (over the full task set, not the date-sorted slice).
  const columnStats = React.useMemo(() => {
    const stats = new Map<
      string,
      { active: number; overdue: number }
    >();
    for (const col of COLUMNS) stats.set(col.key, { active: 0, overdue: 0 });
    for (const t of tasks) {
      if (!projectById.has(t.projectId)) continue;
      const key = t.person || UNASSIGNED;
      const s = stats.get(key);
      if (!s) continue;
      if (t.status !== "Done") {
        s.active += 1;
        const p = projectById.get(t.projectId)!;
        const d = taskDate(t, p);
        if (d && d < today) s.overdue += 1;
      }
    }
    return stats;
  }, [tasks, projectById, today]);

  const visibleColumns = hideEmpty
    ? COLUMNS.filter(
        (c) => c.key === UNASSIGNED || tasksForColumn(c.key).length > 0
      )
    : COLUMNS;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="mx-auto w-full max-w-[100rem] space-y-6 p-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon" aria-label="กลับหน้าหลัก">
              <Link href="/">
                <ArrowLeft />
              </Link>
            </Button>
            <div className="flex size-10 items-center justify-center rounded-xl bg-foreground text-background">
              <Users className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Team Workload
              </h1>
              <p className="text-sm text-muted-foreground">
                ทุกงานจากทุกโปรเจกต์ · แยกตามผู้รับผิดชอบ
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={hideDone}
                onCheckedChange={(v) => setHideDone(v === true)}
              />
              ซ่อนงานที่เสร็จแล้ว
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={hideEmpty}
                onCheckedChange={(v) => setHideEmpty(v === true)}
              />
              ซ่อนคนที่ไม่มีงาน
            </label>
          </div>
        </header>

        <div className="overflow-x-auto rounded-xl border p-3">
          <div className="flex gap-3">
            {visibleColumns.map((col) => {
              const colTasks = tasksForColumn(col.key);
              const stats = columnStats.get(col.key) ?? {
                active: 0,
                overdue: 0,
              };
              const isOver = overColumn === col.key;
              const isUnassigned = col.key === UNASSIGNED;
              return (
                <div
                  key={col.key}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    setOverColumn(col.key);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setOverColumn((c) => (c === col.key ? null : c));
                    }
                  }}
                  onDrop={(e) => handleDrop(e, col.key)}
                  className={cn(
                    "flex w-72 shrink-0 flex-col rounded-lg bg-muted/40 transition-colors",
                    isOver && "bg-primary/10 ring-2 ring-primary/40"
                  )}
                >
                  <div className="flex items-center gap-2 border-b px-3 py-2">
                    {isUnassigned ? (
                      <span className="flex size-6 items-center justify-center rounded-full border border-dashed text-[10px] text-muted-foreground">
                        ?
                      </span>
                    ) : (
                      <Avatar className="size-6">
                        <AvatarFallback className="text-[10px]">
                          {initialsOf(col.key)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <span className="text-sm font-semibold">{col.label}</span>
                    <div className="ml-auto flex items-center gap-1.5">
                      {stats.overdue > 0 && (
                        <span className="rounded-full bg-red-500/15 px-2 text-xs font-medium tabular-nums text-red-700 dark:text-red-400">
                          {stats.overdue} เกินกำหนด
                        </span>
                      )}
                      <span className="rounded-full bg-background px-2 text-xs tabular-nums text-muted-foreground">
                        {stats.active}
                      </span>
                    </div>
                  </div>

                  <div className="flex min-h-24 flex-1 flex-col gap-2 p-2">
                    {colTasks.map((task) => {
                      const project = projectById.get(task.projectId);
                      if (!project) return null;
                      const date = taskDate(task, project);
                      const overdue =
                        date !== null &&
                        date < today &&
                        task.status !== "Done";
                      const disableDone =
                        (unmetCountByTask.get(task.id) ?? 0) > 0;
                      return (
                        <TaskCard
                          key={task.id}
                          task={task}
                          project={project}
                          date={date}
                          overdue={overdue}
                          disableDone={disableDone}
                          isDragging={draggingId === task.id}
                          onDragStart={(e, cardEl) => {
                            e.dataTransfer.setData("text/plain", task.id);
                            e.dataTransfer.effectAllowed = "move";
                            if (cardEl)
                              e.dataTransfer.setDragImage(cardEl, 20, 20);
                            setDraggingId(task.id);
                          }}
                          onDragEnd={() => setDraggingId(null)}
                          onStatusChange={(status) =>
                            handleTaskUpdate(task.id, { status })
                          }
                          onAssigneeChange={(patch) =>
                            handleTaskUpdate(task.id, patch)
                          }
                        />
                      );
                    })}
                    {colTasks.length === 0 && (
                      <div className="flex flex-1 items-center justify-center rounded-md border border-dashed py-6 text-xs text-muted-foreground">
                        {isUnassigned ? "ไม่มีงานค้าง" : "ลากงานมาที่นี่"}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
