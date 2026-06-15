"use client";

import * as React from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  FileText,
  Link2,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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

/** Expanded panel under a project row: sub-tasks grouped by pack */
function SubTaskPanel({
  project,
  tasks,
  onTaskUpdate,
}: {
  project: Project;
  tasks: Task[];
  onTaskUpdate: (taskId: string, patch: Partial<Task>) => void;
}) {
  return (
    <div className="grid gap-3 bg-muted/40 p-4 lg:grid-cols-2">
      {TASK_GROUPS.map((group: TaskGroup) => {
        const groupTasks = tasks.filter((t) => t.group === group);
        return (
          <div key={group} className="rounded-lg border bg-background">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <span className="text-sm font-medium">{group}</span>
              <StatusBadge status={packStatus(groupTasks)} />
            </div>
            <div className="divide-y">
              {groupTasks.map((task) => (
                <SubTaskRow
                  key={task.id}
                  task={task}
                  project={project}
                  allTasks={tasks}
                  onTaskUpdate={onTaskUpdate}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ProjectTable({
  projects,
  tasks,
  onOpenDetails,
  onTaskUpdate,
}: {
  projects: Project[];
  tasks: Task[];
  onOpenDetails: (project: Project) => void;
  onTaskUpdate: (taskId: string, patch: Partial<Task>) => void;
}) {
  const [expanded, setExpanded] = React.useState<Set<string>>(
    () => new Set(["1"])
  );

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

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
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={TASK_GROUPS.length + 3}
                className="py-12 text-center text-sm text-muted-foreground"
              >
                ไม่มีโปรเจกต์ในสังกัดนี้
              </TableCell>
            </TableRow>
          )}
          {projects.map((project) => {
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
                        <div className="font-medium">{project.songName}</div>
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
                </TableRow>
                {isOpen && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={TASK_GROUPS.length + 3} className="p-0">
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
        </TableBody>
      </Table>
    </div>
  );
}
