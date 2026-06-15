"use client";

import * as React from "react";
import { CalendarDays, GripVertical, Music2 } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatShort, startOfToday, toISODate } from "@/lib/dates";
import {
  ROLES,
  UNASSIGNED,
  initialsOf,
  membersOfRole,
  taskDeadline,
} from "@/lib/mock-data";
import type { Project, Task } from "@/lib/types";
import { StatusBadge } from "./status-badge";

// Columns represent ROLES (departments). Unassigned bucket comes first.
const COLUMNS: { role: string; label: string }[] = [
  { role: UNASSIGNED, label: "Unassigned" },
  ...ROLES.map((role) => ({ role, label: role })),
];

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
}: {
  task: Task;
  project: Project;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, cardEl: HTMLElement | null) => void;
  onDragEnd: () => void;
  onPersonChange: (person: string) => void;
}) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const deadline = taskDeadline(task, project);
  const overdue = deadline < startOfToday() && task.status !== "Done";

  return (
    <div
      ref={cardRef}
      className={cn(
        "rounded-lg border border-t-4 bg-background p-3 shadow-sm transition",
        LABEL_BORDER[project.label] ?? "border-t-border",
        isDragging && "opacity-40"
      )}
    >
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
        {/* Drag handle — only this initiates the drag, so the person
            Select inside the card stays clickable */}
        <button
          type="button"
          draggable
          onDragStart={(e) => onDragStart(e, cardRef.current)}
          onDragEnd={onDragEnd}
          aria-label="ลากเพื่อย้ายแผนก"
          className="shrink-0 cursor-grab text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>
      </div>

      {/* Task name */}
      <div className="mt-2 border-t pt-2 text-sm leading-snug">{task.name}</div>

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
      .sort((a, b) => deadlineKey(a).localeCompare(deadlineKey(b)));
  }, [tasks, projectById, effectiveProject]);

  function tasksForColumn(role: string) {
    return sortedVisibleTasks.filter((t) => (t.role || UNASSIGNED) === role);
  }

  function handleDrop(e: React.DragEvent, role: string) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    // Moving departments resets the specific person (new team, new owner)
    if (taskId) onTaskUpdate(taskId, { role, person: "" });
    setOverColumn(null);
    setDraggingId(null);
  }

  return (
    <div className="space-y-3">
      {/* Secondary filter — by project */}
      <div className="flex items-center gap-2">
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
      </div>

      <div className="overflow-x-auto rounded-xl border p-3">
        <div className="flex gap-3">
          {COLUMNS.map((col) => {
            const colTasks = tasksForColumn(col.role);
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
                onDrop={(e) => handleDrop(e, col.role)}
                className={cn(
                  "flex w-72 shrink-0 flex-col rounded-lg bg-muted/40 transition-colors",
                  isOver && "bg-primary/10 ring-2 ring-primary/40"
                )}
              >
                <div className="flex items-center gap-2 border-b px-3 py-2">
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
                </div>

                <div className="flex min-h-24 flex-1 flex-col gap-2 p-2">
                  {colTasks.map((task) => {
                    const project = projectById.get(task.projectId);
                    if (!project) return null;
                    return (
                      <TaskCard
                        key={task.id}
                        task={task}
                        project={project}
                        isDragging={draggingId === task.id}
                        onDragStart={(e, cardEl) => {
                          e.dataTransfer.setData("text/plain", task.id);
                          e.dataTransfer.effectAllowed = "move";
                          if (cardEl) e.dataTransfer.setDragImage(cardEl, 20, 20);
                          setDraggingId(task.id);
                        }}
                        onDragEnd={() => setDraggingId(null)}
                        onPersonChange={(person) =>
                          onTaskUpdate(task.id, { person })
                        }
                      />
                    );
                  })}
                  {colTasks.length === 0 && (
                    <div className="flex flex-1 items-center justify-center rounded-md border border-dashed py-6 text-xs text-muted-foreground">
                      ลากงานมาที่นี่
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
