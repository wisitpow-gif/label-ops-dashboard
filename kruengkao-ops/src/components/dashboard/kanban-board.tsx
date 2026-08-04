"use client";

import * as React from "react";
import {
  CalendarDays,
  ChevronsLeftRight,
  ChevronsRightLeft,
  GripVertical,
  Music2,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { formatShort, startOfToday, toISODate } from "@/lib/dates";
import { UNASSIGNED, initialsOf, taskDeadline } from "@/lib/mock-data";
import { TEAM_ROLES } from "@/lib/team";
import { useTeam } from "@/components/team/team-provider";
import type { Project, Task } from "@/lib/types";
import { StatusBadge } from "./status-badge";

// Columns represent ROLES (departments); the Unassigned bucket sits last so
// the actionable, owned work reads first.
const COLUMNS: { role: string; label: string }[] = [
  ...TEAM_ROLES.map((role) => ({ role, label: role })),
  { role: UNASSIGNED, label: "Unassigned" },
];

/** Done / overdue / total counts for a set of tasks (per-member sub-column). */
function countsFor(
  list: Task[],
  projectById: Map<string, Project>,
  today: Date
): { done: number; overdue: number; total: number } {
  let done = 0;
  let overdue = 0;
  for (const t of list) {
    if (t.status === "Done") done += 1;
    else {
      const p = projectById.get(t.projectId);
      if (p && taskDeadline(t, p) < today) overdue += 1;
    }
  }
  return { done, overdue, total: list.length };
}

// Department accent colors for the column header dot
const ROLE_DOT: Record<string, string> = {
  Unassigned: "bg-muted-foreground/40",
  Promoter: "bg-blue-500",
  "Creative/MarCom": "bg-pink-500",
  Graphics: "bg-violet-500",
  Producer: "bg-emerald-500",
  Digital: "bg-amber-500",
  Distributor: "bg-cyan-500",
};

// Label → accent color for the card's top border + label chip
const LABEL_BORDER: Record<string, string> = {
  BRIDGE: "border-t-blue-500",
  MACHg: "border-t-violet-500",
  "9Arkkhan": "border-t-amber-500",
};
const LABEL_CHIP: Record<string, string> = {
  BRIDGE: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  MACHg: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  "9Arkkhan": "bg-amber-500/15 text-amber-700 dark:text-amber-500",
};

const ALL_PROJECTS = "all";
const NO_PERSON = "__none__";

/** Tier-2 picker: choose a specific person from the card's current role team */
function PersonSelect({
  role,
  person,
  onChange,
}: {
  role: string;
  person: string;
  onChange: (person: string) => void;
}) {
  const { membersOfRole } = useTeam();
  const members = membersOfRole(role);
  if (members.length === 0) return null;

  return (
    <Select
      value={person || NO_PERSON}
      onValueChange={(v) => onChange(v === NO_PERSON ? "" : v)}
    >
      <SelectTrigger
        size="sm"
        aria-label="มอบหมายบุคคล"
        className={cn(
          "h-7 w-full gap-1.5 rounded-md border-transparent bg-muted py-0 pr-2 pl-1 text-xs shadow-none",
          "[&>svg]:size-3 [&>svg]:opacity-60"
        )}
      >
        {person ? (
          <span className="flex items-center gap-1.5">
            <Avatar className="size-5">
              <AvatarFallback className="text-[9px]">
                {initialsOf(person)}
              </AvatarFallback>
            </Avatar>
            <span className="text-foreground/80">{person}</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="flex size-5 items-center justify-center rounded-full border border-dashed text-[9px]">
              ?
            </span>
            มอบหมายบุคคล
          </span>
        )}
      </SelectTrigger>
      <SelectContent position="popper" align="start" sideOffset={4}>
        <SelectItem value={NO_PERSON}>
          <span className="text-muted-foreground">ยังไม่ระบุ</span>
        </SelectItem>
        <SelectSeparator />
        {members.map((m) => (
          <SelectItem key={m} value={m}>
            <span className="flex items-center gap-2">
              <Avatar className="size-5">
                <AvatarFallback className="text-[9px]">
                  {initialsOf(m)}
                </AvatarFallback>
              </Avatar>
              {m}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function TaskCard({
  task,
  project,
  isDragging,
  onDragStart,
  onDragEnd,
  onPersonChange,
  compact = false,
}: {
  task: Task;
  project: Project;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, cardEl: HTMLElement | null) => void;
  onDragEnd: () => void;
  onPersonChange: (person: string) => void;
  /** When grouped under a project header, drop the project block and lead with the task. */
  compact?: boolean;
}) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const deadline = taskDeadline(task, project);
  const overdue = deadline < startOfToday() && task.status !== "Done";

  // Drag handle — only this initiates the drag, so the person Select inside
  // the card stays clickable.
  const dragHandle = (
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
  );

  return (
    <div
      ref={cardRef}
      className={cn(
        "rounded-lg border border-t-4 bg-background p-3 shadow-sm transition",
        LABEL_BORDER[project.label] ?? "border-t-border",
        isDragging && "opacity-40"
      )}
    >
      {compact ? (
        /* Task-focused: the project is shown in the group header above */
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 text-sm font-medium leading-snug">
            {task.name}
          </div>
          {dragHandle}
        </div>
      ) : (
        <>
          {/* Project context — the dominant block */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-bold leading-snug">
                {project.songName}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                <span className="truncate text-xs font-medium text-muted-foreground">
                  {project.artistName}
                </span>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide",
                    LABEL_CHIP[project.label] ?? "bg-muted text-muted-foreground"
                  )}
                >
                  {project.label}
                </span>
              </div>
            </div>
            {dragHandle}
          </div>
          {/* Task name */}
          <div className="mt-2 border-t pt-2 text-sm leading-snug">
            {task.name}
          </div>
        </>
      )}

      {/* Deadline + status */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <StatusBadge status={task.status} />
        <span
          className={cn(
            "flex items-center gap-1 text-sm font-semibold tabular-nums",
            overdue ? "text-red-600 dark:text-red-400" : "text-foreground/80"
          )}
        >
          <CalendarDays className="size-3.5" />
          {formatShort(deadline)}
        </span>
      </div>

      {/* Tier-2 person assignment within this role */}
      <div className="mt-2">
        <PersonSelect
          role={task.role}
          person={task.person}
          onChange={onPersonChange}
        />
      </div>
    </div>
  );
}

export function KanbanBoard({
  projects,
  tasks,
  onTaskUpdate,
}: {
  projects: Project[];
  tasks: Task[];
  onTaskUpdate: (taskId: string, patch: Partial<Task>) => void;
}) {
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [overColumn, setOverColumn] = React.useState<string | null>(null);
  const [projectFilter, setProjectFilter] = React.useState<string>(ALL_PROJECTS);
  const [hideDone, setHideDone] = React.useState(false);
  // Role columns are unified by default; expanding one breaks it out into
  // side-by-side per-member sub-columns. Others stay collapsed.
  const [expandedRoles, setExpandedRoles] = React.useState<Set<string>>(
    () => new Set()
  );
  const { membersOfRole } = useTeam();

  const toggleRole = (role: string) =>
    setExpandedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });

  const projectById = React.useMemo(() => {
    const map = new Map<string, Project>();
    projects.forEach((p) => map.set(p.id, p));
    return map;
  }, [projects]);

  // Fall back to "all" if the selected project is no longer visible
  // (e.g. the global label filter changed underneath us).
  const effectiveProject =
    projectFilter !== ALL_PROJECTS && projectById.has(projectFilter)
      ? projectFilter
      : ALL_PROJECTS;

  // Sub-tasks for the visible projects, optionally narrowed to one project,
  // then sorted by deadline (earliest first) — recomputed per render.
  const sortedVisibleTasks = React.useMemo(() => {
    const deadlineKey = (t: Task) => {
      const p = projectById.get(t.projectId);
      return p ? toISODate(taskDeadline(t, p)) : "";
    };
    return tasks
      .filter((t) => projectById.has(t.projectId))
      .filter(
        (t) => effectiveProject === ALL_PROJECTS || t.projectId === effectiveProject
      )
      .filter((t) => !(hideDone && t.status === "Done"))
      .sort((a, b) => deadlineKey(a).localeCompare(deadlineKey(b)));
  }, [tasks, projectById, effectiveProject, hideDone]);

  const today = startOfToday();

  function tasksForColumn(role: string) {
    return sortedVisibleTasks.filter((t) => (t.role || UNASSIGNED) === role);
  }

  // Drop onto a collapsed column (person "") sets the role and clears the owner;
  // drop onto a per-member sub-column sets role AND that person in one move.
  function handleDrop(e: React.DragEvent, role: string, person: string) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) onTaskUpdate(taskId, { role, person });
    setOverColumn(null);
    setDraggingId(null);
  }

  // A single (compact) card renderer reused by every column and sub-column.
  const renderCard = (task: Task) => {
    const project = projectById.get(task.projectId);
    if (!project) return null;
    return (
      <TaskCard
        key={task.id}
        task={task}
        project={project}
        compact
        isDragging={draggingId === task.id}
        onDragStart={(e, cardEl) => {
          e.dataTransfer.setData("text/plain", task.id);
          e.dataTransfer.effectAllowed = "move";
          if (cardEl) e.dataTransfer.setDragImage(cardEl, 20, 20);
          setDraggingId(task.id);
        }}
        onDragEnd={() => setDraggingId(null)}
        onPersonChange={(person) => onTaskUpdate(task.id, { person })}
      />
    );
  };

  // Group a column's tasks by project (preserving deadline order, so project
  // groups appear by their earliest task), each under a sticky project header.
  const renderGroupedTasks = (list: Task[]) => {
    const order: string[] = [];
    const byProject = new Map<string, Task[]>();
    for (const t of list) {
      if (!byProject.has(t.projectId)) {
        byProject.set(t.projectId, []);
        order.push(t.projectId);
      }
      byProject.get(t.projectId)!.push(t);
    }
    return order.map((pid) => {
      const project = projectById.get(pid);
      if (!project) return null;
      return (
        <div key={pid} className="space-y-2">
          <div className="sticky top-0 z-10 flex items-center gap-1 rounded-md bg-neutral-700 px-2 py-1 text-[11px] font-semibold text-neutral-50 shadow-sm dark:bg-neutral-800">
            <span className="opacity-60">Project:</span>
            <span className="truncate">{project.songName}</span>
          </div>
          <div className="space-y-2">{byProject.get(pid)!.map(renderCard)}</div>
        </div>
      );
    });
  };

  return (
    <div className="space-y-3">
      {/* Filters — by project + hide-done toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={effectiveProject} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[260px]" aria-label="กรองตามโปรเจกต์">
            <Music2 className="size-4 text-muted-foreground" />
            <SelectValue placeholder="Filter by Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_PROJECTS}>All Projects</SelectItem>
            <SelectSeparator />
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.songName}
                <span className="text-muted-foreground"> · {p.artistName}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="flex cursor-pointer select-none items-center gap-2 text-sm">
          <Switch checked={hideDone} onCheckedChange={setHideDone} />
          <span className={cn(!hideDone && "text-muted-foreground")}>
            Hide Done Tasks
          </span>
        </label>
      </div>

      {/* Fixed-height board: columns fill the height and scroll internally, so
          the horizontal scrollbar stays pinned near the bottom of the screen. */}
      <div className="flex h-[calc(100vh-220px)] gap-3 overflow-x-auto rounded-xl border p-3">
        {COLUMNS.map((col) => {
          const colTasks = tasksForColumn(col.role);
          const canExpand = col.role !== UNASSIGNED;
          const expanded = canExpand && expandedRoles.has(col.role);

          const header = (
            <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2">
              <span
                className={cn(
                  "size-2.5 shrink-0 rounded-full",
                  ROLE_DOT[col.role] ?? "bg-muted-foreground/40"
                )}
              />
              <span className="text-sm font-semibold">{col.label}</span>
              <span className="ml-auto rounded-full bg-background px-2 text-xs tabular-nums text-muted-foreground">
                {colTasks.length}
              </span>
              {canExpand && (
                <button
                  type="button"
                  onClick={() => toggleRole(col.role)}
                  aria-label={
                    expanded
                      ? `ยุบ ${col.label} เป็นคอลัมน์เดียว`
                      : `ขยาย ${col.label} แยกตามผู้รับผิดชอบ`
                  }
                  className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                >
                  {expanded ? (
                    <ChevronsRightLeft className="size-4" />
                  ) : (
                    <ChevronsLeftRight className="size-4" />
                  )}
                </button>
              )}
            </div>
          );

          // COLLAPSED — one unified column with all of the role's tasks.
          if (!expanded) {
            const isOver = overColumn === col.role;
            return (
              <div
                key={col.role}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setOverColumn(col.role);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setOverColumn((c) => (c === col.role ? null : c));
                  }
                }}
                onDrop={(e) => handleDrop(e, col.role, "")}
                className={cn(
                  "flex h-full w-64 shrink-0 flex-col rounded-lg bg-muted/40 transition-colors",
                  isOver && "bg-primary/10 ring-2 ring-primary/40"
                )}
              >
                {header}
                {colTasks.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center p-2">
                    <div className="flex h-full w-full items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
                      ลากงานมาที่นี่
                    </div>
                  </div>
                ) : (
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <div className="space-y-3 p-2">
                      {renderGroupedTasks(colTasks)}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          // EXPANDED — one sub-column per member (+ Unassigned) that scroll
          // horizontally inside the (height-capped) role column.
          const present = colTasks.map((t) => t.person).filter(Boolean);
          const people = [...new Set([...membersOfRole(col.role), ...present])];
          const subCols = [
            ...people.map((p) => ({ person: p, label: p })),
            { person: "", label: "Unassigned" },
          ];
          return (
            <div
              key={col.role}
              className="flex h-full max-w-[56rem] shrink-0 flex-col rounded-lg bg-muted/40 ring-1 ring-primary/30"
            >
              {header}
              <div className="flex min-h-0 min-w-0 flex-1 gap-2 overflow-x-auto p-2">
                {subCols.map((sc) => {
                  const scTasks = colTasks.filter(
                    (t) => (t.person || "") === sc.person
                  );
                  const { done, overdue, total } = countsFor(
                    scTasks,
                    projectById,
                    today
                  );
                  const cleared = total > 0 && done === total;
                  const isUnassigned = sc.person === "";
                  const key = `${col.role}::${sc.person}`;
                  const isOver = overColumn === key;
                  return (
                    <div
                      key={sc.person || "__unassigned__"}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        setOverColumn(key);
                      }}
                      onDragLeave={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                          setOverColumn((c) => (c === key ? null : c));
                        }
                      }}
                      onDrop={(e) => handleDrop(e, col.role, sc.person)}
                      className={cn(
                        "flex h-full w-52 shrink-0 flex-col rounded-md border bg-background/50 transition-colors",
                        isOver && "bg-primary/10 ring-2 ring-primary/40"
                      )}
                    >
                      <div className="flex shrink-0 items-center gap-1.5 border-b px-2 py-1.5">
                        {isUnassigned ? (
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-dashed text-[9px] text-muted-foreground">
                            ?
                          </span>
                        ) : (
                          <Avatar className="size-5 shrink-0">
                            <AvatarFallback className="text-[9px]">
                              {initialsOf(sc.person)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <span className="truncate text-xs font-medium">
                          {sc.label}
                        </span>
                        <span
                          title={`${done} เสร็จ · ${total - done} ค้าง${
                            overdue > 0 ? ` · ${overdue} เกินกำหนด` : ""
                          }`}
                          className={cn(
                            "ml-auto shrink-0 rounded-full border px-1.5 text-[10px] font-medium tabular-nums",
                            overdue > 0
                              ? "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400"
                              : cleared
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                : "bg-background text-muted-foreground"
                          )}
                        >
                          {done}/{total}
                        </span>
                      </div>
                      {scTasks.length === 0 ? (
                        <div className="flex flex-1 items-center justify-center p-2">
                          <div className="flex h-full w-full items-center justify-center rounded-md border border-dashed text-center text-[11px] text-muted-foreground">
                            ลากมาที่นี่
                          </div>
                        </div>
                      ) : (
                        <div className="min-h-0 flex-1 overflow-y-auto">
                          <div className="space-y-3 p-2">
                            {renderGroupedTasks(scTasks)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
