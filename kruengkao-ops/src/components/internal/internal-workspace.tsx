"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Link2,
  Lock,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

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
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatFull, parseDate, startOfToday, toISODate } from "@/lib/dates";
import {
  addTaskDependency,
  createInternalProject,
  createTask,
  deleteInternalProject,
  deleteTask,
  removeTaskDependency,
  updateInternalProject,
  updateTask,
} from "@/app/actions";
import type { Project, Task, TaskDependency, TaskStatus } from "@/lib/types";
import { AssigneeSelect, StatusSelect } from "@/components/dashboard/task-controls";

// ---------------------------------------------------------------------------
// Project create/edit dialog (name + optional target date)
// ---------------------------------------------------------------------------

function ProjectDialog({
  open,
  onOpenChange,
  project,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project;
  onSubmit: (values: { name: string; targetDate: string | null }) => Promise<void>;
}) {
  const [name, setName] = React.useState(project?.songName ?? "");
  const [target, setTarget] = React.useState<Date | undefined>(
    project?.targetDate ? parseDate(project.targetDate) : undefined
  );
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  async function save() {
    if (!name.trim()) {
      setError("กรอกชื่องาน");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        targetDate: target ? toISODate(target) : null,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onCloseAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>
            {project ? "Edit Internal Project" : "New Internal Project"}
          </DialogTitle>
          <DialogDescription>
            งานภายใน / Ad-Hoc — มีเป้าหมายวันเสร็จได้ (ไม่บังคับ)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="projName">Name</Label>
            <Input
              id="projName"
              placeholder="เช่น จัดงาน Meet & Greet, ทำ Presskit ค่าย"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Target date (optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start font-normal",
                    !target && "text-muted-foreground"
                  )}
                >
                  <CalendarDays data-icon="inline-start" />
                  {target ? formatFull(target) : "ไม่กำหนด"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={target} onSelect={setTarget} autoFocus />
                {target && (
                  <div className="border-t p-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setTarget(undefined)}
                    >
                      ล้างวันที่
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost" disabled={saving}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={save} disabled={saving}>
            {saving ? "Saving…" : project ? "Save Changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Task create dialog
// ---------------------------------------------------------------------------

function TaskDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: {
    taskName: string;
    role: string;
    person: string;
    dueDate: string | null;
  }) => Promise<void>;
}) {
  const [taskName, setTaskName] = React.useState("");
  const [role, setRole] = React.useState("Unassigned");
  const [person, setPerson] = React.useState("");
  const [due, setDue] = React.useState<Date | undefined>(undefined);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  async function save() {
    if (!taskName.trim()) {
      setError("กรอกชื่องาน");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        taskName: taskName.trim(),
        role,
        person,
        dueDate: due ? toISODate(due) : null,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onCloseAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
          <DialogDescription>เพิ่มงานย่อยในโปรเจกต์ภายในนี้</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="taskName">Task Name</Label>
            <Input
              id="taskName"
              placeholder="เช่น จองสถานที่, ออกแบบโปสเตอร์"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Assignee</Label>
            <AssigneeSelect
              role={role}
              person={person}
              onChange={(patch) => {
                setRole(patch.role);
                setPerson(patch.person);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Due date (optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start font-normal",
                    !due && "text-muted-foreground"
                  )}
                >
                  <CalendarDays data-icon="inline-start" />
                  {due ? formatFull(due) : "ไม่กำหนด"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={due} onSelect={setDue} autoFocus />
                {due && (
                  <div className="border-t p-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setDue(undefined)}
                    >
                      ล้างวันที่
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost" disabled={saving}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={save} disabled={saving}>
            {saving ? "Adding…" : "Add Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Dependency editor — pick which sibling tasks gate this one
// ---------------------------------------------------------------------------

function DependencyDialog({
  task,
  siblings,
  prereqIds,
  onOpenChange,
  onToggle,
}: {
  task: Task | null;
  siblings: Task[];
  prereqIds: Set<string>;
  onOpenChange: (open: boolean) => void;
  onToggle: (task: Task, prereq: Task, checked: boolean) => Promise<void>;
}) {
  return (
    <Dialog open={!!task} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onCloseAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Prerequisites · {task?.name}</DialogTitle>
          <DialogDescription>
            เลือกงานที่ต้องเสร็จก่อน — งานนี้จะ Mark Done ไม่ได้จนกว่างานที่เลือกจะ Done
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[50vh] space-y-1 overflow-y-auto">
          {siblings.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              ยังไม่มีงานอื่นในโปรเจกต์นี้
            </p>
          ) : (
            siblings.map((s) => (
              <label
                key={s.id}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent"
              >
                <Checkbox
                  checked={prereqIds.has(s.id)}
                  onCheckedChange={(c) => task && onToggle(task, s, c === true)}
                />
                <span className="flex-1">{s.name}</span>
                <Badge variant="outline" className="text-xs">
                  {s.status}
                </Badge>
              </label>
            ))
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Done
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Internal Workspace
// ---------------------------------------------------------------------------

export function InternalWorkspace({
  initialProjects,
  initialTasks,
  initialDependencies,
}: {
  initialProjects: Project[];
  initialTasks: Task[];
  initialDependencies: TaskDependency[];
}) {
  const [projects, setProjects] = React.useState(initialProjects);
  const [tasks, setTasks] = React.useState(initialTasks);
  const [deps, setDeps] = React.useState(initialDependencies);

  const [projectDialog, setProjectDialog] = React.useState<{
    project?: Project;
  } | null>(null);
  const [taskDialogFor, setTaskDialogFor] = React.useState<string | null>(null);
  const [depTask, setDepTask] = React.useState<Task | null>(null);
  const [deleteProjectTarget, setDeleteProjectTarget] =
    React.useState<Project | null>(null);
  const [deleteTaskTarget, setDeleteTaskTarget] = React.useState<Task | null>(
    null
  );

  const taskById = React.useMemo(() => {
    const m = new Map<string, Task>();
    tasks.forEach((t) => m.set(t.id, t));
    return m;
  }, [tasks]);

  // prereqIds for a task, and the unmet (not-Done) ones
  function prereqsOf(taskId: string) {
    return deps.filter((d) => d.taskId === taskId).map((d) => d.dependsOnTaskId);
  }
  function unmetPrereqs(taskId: string): Task[] {
    return prereqsOf(taskId)
      .map((id) => taskById.get(id))
      .filter((t): t is Task => !!t && t.status !== "Done");
  }

  async function handleCreateProject(values: {
    name: string;
    targetDate: string | null;
  }) {
    const created = await createInternalProject(values);
    setProjects((p) => [created, ...p]);
    toast.success("สร้างโปรเจกต์ภายในแล้ว");
  }

  async function handleEditProject(
    id: string,
    values: { name: string; targetDate: string | null }
  ) {
    const updated = await updateInternalProject(id, values);
    setProjects((p) => p.map((x) => (x.id === id ? updated : x)));
    toast.success("บันทึกแล้ว");
  }

  async function handleDeleteProject(id: string) {
    try {
      await deleteInternalProject(id);
      setProjects((p) => p.filter((x) => x.id !== id));
      setTasks((t) => t.filter((x) => x.projectId !== id));
      toast.success("ลบโปรเจกต์แล้ว");
    } catch (err) {
      console.error(err);
      toast.error("ลบไม่สำเร็จ");
    }
  }

  async function handleCreateTask(
    projectId: string,
    values: { taskName: string; role: string; person: string; dueDate: string | null }
  ) {
    const created = await createTask({ projectId, ...values });
    setTasks((t) => [...t, created]);
    toast.success("เพิ่มงานแล้ว");
  }

  async function handleDeleteTask(id: string) {
    try {
      await deleteTask(id);
      setTasks((t) => t.filter((x) => x.id !== id));
      setDeps((d) => d.filter((x) => x.taskId !== id && x.dependsOnTaskId !== id));
      toast.success("ลบงานแล้ว");
    } catch (err) {
      console.error(err);
      toast.error("ลบไม่สำเร็จ");
    }
  }

  function handleStatus(task: Task, status: TaskStatus) {
    const prev = task.status;
    setTasks((t) => t.map((x) => (x.id === task.id ? { ...x, status } : x)));
    updateTask(task.id, { status }).catch((err) => {
      setTasks((t) => t.map((x) => (x.id === task.id ? { ...x, status: prev } : x)));
      toast.error(err instanceof Error ? err.message : "อัปเดตไม่สำเร็จ");
    });
  }

  function handleAssignee(task: Task, patch: { role: string; person: string }) {
    const prev = { role: task.role, person: task.person };
    setTasks((t) => t.map((x) => (x.id === task.id ? { ...x, ...patch } : x)));
    updateTask(task.id, patch).catch((err) => {
      setTasks((t) => t.map((x) => (x.id === task.id ? { ...x, ...prev } : x)));
      toast.error(err instanceof Error ? err.message : "อัปเดตไม่สำเร็จ");
    });
  }

  async function handleToggleDep(task: Task, prereq: Task, checked: boolean) {
    if (checked) {
      try {
        const created = await addTaskDependency(task.id, prereq.id);
        setDeps((d) => [...d, created]);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "เพิ่ม dependency ไม่ได้");
      }
    } else {
      const edge = deps.find(
        (d) => d.taskId === task.id && d.dependsOnTaskId === prereq.id
      );
      if (!edge) return;
      try {
        await removeTaskDependency(edge.id);
        setDeps((d) => d.filter((x) => x.id !== edge.id));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "ลบ dependency ไม่ได้");
      }
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <header className="space-y-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          กลับสู่ Dashboard
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-foreground text-background">
              <ClipboardList className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Internal / Ad-Hoc Work
              </h1>
              <p className="text-sm text-muted-foreground">
                งานภายในค่าย — เพิ่มงานเอง กำหนด hard gate ระหว่างงานได้
              </p>
            </div>
          </div>
          <Button onClick={() => setProjectDialog({})}>
            <Plus data-icon="inline-start" />
            New Project
          </Button>
        </div>
      </header>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
          <ClipboardList className="size-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">ยังไม่มีงานภายใน</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            กด “New Project” เพื่อสร้างงาน Ad-Hoc ชิ้นแรก
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const projTasks = tasks.filter((t) => t.projectId === project.id);
            const done = projTasks.filter((t) => t.status === "Done").length;
            const overdue =
              project.targetDate &&
              parseDate(project.targetDate) < startOfToday();
            return (
              <div key={project.id} className="overflow-hidden rounded-xl border">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-4 py-3">
                  <div className="min-w-0">
                    <div className="font-medium">{project.songName}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="tabular-nums">
                        {done}/{projTasks.length} done
                      </span>
                      {project.targetDate && (
                        <span
                          className={cn(
                            "flex items-center gap-1",
                            overdue && "font-medium text-red-600 dark:text-red-400"
                          )}
                        >
                          <CalendarDays className="size-3.5" />
                          ครบกำหนด {formatFull(parseDate(project.targetDate))}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTaskDialogFor(project.id)}
                    >
                      <Plus data-icon="inline-start" />
                      Add Task
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground"
                      aria-label="แก้ไขโปรเจกต์"
                      onClick={() => setProjectDialog({ project })}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      aria-label="ลบโปรเจกต์"
                      onClick={() => setDeleteProjectTarget(project)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                {projTasks.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                    ยังไม่มีงาน — กด “Add Task”
                  </p>
                ) : (
                  <div className="divide-y">
                    {projTasks.map((task) => {
                      const prereqIds = prereqsOf(task.id);
                      const unmet = unmetPrereqs(task.id);
                      const dueOverdue =
                        task.dueDate &&
                        task.status !== "Done" &&
                        parseDate(task.dueDate) < startOfToday();
                      return (
                        <div
                          key={task.id}
                          className="flex flex-wrap items-center gap-2 px-4 py-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium">
                                {task.name}
                              </span>
                              {prereqIds.length > 0 && (
                                <span
                                  className={cn(
                                    "flex items-center gap-0.5 text-xs",
                                    unmet.length > 0
                                      ? "text-amber-600 dark:text-amber-500"
                                      : "text-muted-foreground"
                                  )}
                                  title={
                                    unmet.length > 0
                                      ? `รอ: ${unmet.map((u) => u.name).join(", ")}`
                                      : "prerequisites ครบแล้ว"
                                  }
                                >
                                  {unmet.length > 0 ? (
                                    <Lock className="size-3" />
                                  ) : (
                                    <Link2 className="size-3" />
                                  )}
                                  {prereqIds.length}
                                </span>
                              )}
                            </div>
                            {task.dueDate && (
                              <div
                                className={cn(
                                  "text-xs tabular-nums",
                                  dueOverdue
                                    ? "font-medium text-red-600 dark:text-red-400"
                                    : "text-muted-foreground"
                                )}
                              >
                                due {formatFull(parseDate(task.dueDate))}
                              </div>
                            )}
                          </div>
                          <StatusSelect
                            value={task.status}
                            onChange={(s) => handleStatus(task, s)}
                            disableDone={unmet.length > 0}
                            disableDoneReason={
                              unmet.length > 0 ? "prerequisites ยังไม่เสร็จ" : undefined
                            }
                          />
                          <AssigneeSelect
                            role={task.role}
                            person={task.person}
                            onChange={(patch) => handleAssignee(task, patch)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground"
                            aria-label="แก้ prerequisites"
                            onClick={() => setDepTask(task)}
                          >
                            <Link2 className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-destructive"
                            aria-label="ลบงาน"
                            onClick={() => setDeleteTaskTarget(task)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Project create/edit */}
      <ProjectDialog
        key={projectDialog?.project?.id ?? (projectDialog ? "new" : "closed")}
        open={!!projectDialog}
        onOpenChange={(o) => {
          if (!o) setProjectDialog(null);
        }}
        project={projectDialog?.project}
        onSubmit={
          projectDialog?.project
            ? (v) => handleEditProject(projectDialog.project!.id, v)
            : handleCreateProject
        }
      />

      {/* Task create */}
      <TaskDialog
        key={taskDialogFor ?? "task-closed"}
        open={!!taskDialogFor}
        onOpenChange={(o) => {
          if (!o) setTaskDialogFor(null);
        }}
        onSubmit={(v) => handleCreateTask(taskDialogFor!, v)}
      />

      {/* Dependency editor */}
      <DependencyDialog
        task={depTask}
        siblings={
          depTask
            ? tasks.filter(
                (t) => t.projectId === depTask.projectId && t.id !== depTask.id
              )
            : []
        }
        prereqIds={new Set(depTask ? prereqsOf(depTask.id) : [])}
        onOpenChange={(o) => {
          if (!o) setDepTask(null);
        }}
        onToggle={handleToggleDep}
      />

      {/* Delete project */}
      <AlertDialog
        open={!!deleteProjectTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteProjectTarget(null);
        }}
      >
        <AlertDialogContent onCloseAutoFocus={(e) => e.preventDefault()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleteProjectTarget?.songName}” และงานทั้งหมดในนั้นจะถูกลบถาวร
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
                if (deleteProjectTarget) handleDeleteProject(deleteProjectTarget.id);
                setDeleteProjectTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete task */}
      <AlertDialog
        open={!!deleteTaskTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTaskTarget(null);
        }}
      >
        <AlertDialogContent onCloseAutoFocus={(e) => e.preventDefault()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleteTaskTarget?.name}” จะถูกลบ และ dependency ที่เกี่ยวข้องจะถูกล้าง
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
                if (deleteTaskTarget) handleDeleteTask(deleteTaskTarget.id);
                setDeleteTaskTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
