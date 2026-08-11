"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarRange,
  ChartGantt,
  ClipboardList,
  Disc3,
  LayoutDashboard,
  Library,
  ListFilter,
  Plus,
  Settings,
  SquareKanban,
  Table2,
  UserCog,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { parseDate, toISODate } from "@/lib/dates";
import { PROJECT_TYPES } from "@/lib/constants";
import type {
  Project,
  ProjectType,
  Task,
  TaskGroup,
  TaskTemplate,
} from "@/lib/types";
import { toast } from "sonner";

import {
  createProject,
  createProjectTask,
  deleteProject,
  updateProject,
  updateTask,
} from "@/app/actions";
import { UserMenu } from "@/components/auth/user-menu";
import { CalendarView } from "./calendar-view";
import {
  CreateTaskDialog,
  type CreateTaskValues,
} from "./create-task-dialog";
import { EditTaskDialog, type EditTaskPatch } from "./edit-task-dialog";
import { GanttChart } from "./gantt-chart";
import { KanbanBoard } from "./kanban-board";
import { OverviewDashboard } from "./overview-dashboard";
import {
  ProjectFormDialog,
  type NewProjectInput,
  type ProjectFormSubmit,
} from "./project-form-dialog";
import { ProjectDetailsSheet } from "./project-details-sheet";
import { ProjectTable } from "./project-table";

export function DashboardShell({
  initialProjects,
  initialTasks,
  userEmail,
  taskTemplates = [],
  currentPerson = null,
  initialTab = "overview",
}: {
  initialProjects: Project[];
  initialTasks: Task[];
  userEmail?: string | null;
  taskTemplates?: TaskTemplate[];
  /** Team-member name matched to the signed-in user (drives "My Tasks"). */
  currentPerson?: string | null;
  /** Which tab to open on mount (from the ?tab= query param). */
  initialTab?: string;
}) {
  const [projects, setProjects] = React.useState<Project[]>(initialProjects);
  const [tasks, setTasks] = React.useState<Task[]>(initialTasks);
  const [detailsProject, setDetailsProject] = React.useState<Project | null>(
    null
  );
  // Multi-select project-type filter — all types shown by default.
  const [selectedTypes, setSelectedTypes] = React.useState<Set<ProjectType>>(
    () => new Set(PROJECT_TYPES)
  );
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editProject, setEditProject] = React.useState<Project | null>(null);
  const [editTask, setEditTask] = React.useState<Task | null>(null);
  // Ad-hoc "+ Add Task" context: which project + locked category to create under.
  const [addTaskCtx, setAddTaskCtx] = React.useState<{
    project: Project;
    category: TaskGroup;
  } | null>(null);

  // Persist the new project + its template tasks, then merge into local state.
  async function handleCreate(values: ProjectFormSubmit) {
    const { project, tasks: newTasks } = await createProject({
      songTitle: values.songTitle,
      artist: values.artist,
      label: values.label,
      projectType: values.projectType,
      releaseDate: toISODate(values.releaseDate),
      assignments: values.assignments,
      tasks: values.tasks,
    });
    setProjects((prev) => [...prev, project]);
    setTasks((prev) => [...prev, ...newTasks]);
  }

  // Persist the edit to Supabase, then reconcile local state with the
  // authoritative row it returns. Throws on failure so the dialog stays open.
  async function handleUpdateProject(values: NewProjectInput) {
    if (!editProject) return;
    const updated = await updateProject({
      id: editProject.id,
      songTitle: values.songTitle,
      artist: values.artist,
      label: values.label,
      releaseDate: toISODate(values.releaseDate),
    });
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  // Delete in Supabase first (tasks/expenses/splits cascade), then drop it
  // from local state so the UI reflects the true DB state.
  async function handleDeleteProject(id: string) {
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setTasks((prev) => prev.filter((t) => t.projectId !== id));
      setDetailsProject((prev) => (prev?.id === id ? null : prev));
    } catch (err) {
      console.error("Failed to delete project", err);
    }
  }

  // Project → form values for the edit dialog (releaseDate string → Date)
  const editValues: NewProjectInput | undefined = editProject
    ? {
        songTitle: editProject.songName,
        artist: editProject.artistName,
        label: editProject.label,
        projectType: editProject.projectType,
        releaseDate: parseDate(editProject.releaseDate),
      }
    : undefined;

  // Patch a single sub-task with an optimistic update, persist in the
  // background, and roll back + toast if the Supabase write fails.
  const handleTaskUpdate = React.useCallback(
    (taskId: string, patch: Partial<Task>) => {
      // Capture the pre-change task (via the functional updater) for rollback.
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
          setTasks((cur) =>
            cur.map((t) => (t.id === taskId ? restore : t))
          );
        }
        toast.error("บันทึกการเปลี่ยนแปลงไม่สำเร็จ", {
          description: "เปลี่ยนกลับเป็นค่าเดิมแล้ว — กรุณาลองอีกครั้ง",
        });
      });
    },
    []
  );

  // Save a task edit (name + deadline) optimistically; roll back + rethrow on
  // failure so the modal can surface the error and stay open.
  async function handleTaskEdit(patch: EditTaskPatch) {
    if (!editTask) return;
    const taskId = editTask.id;
    let previous: Task | undefined;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          previous = t;
          return {
            ...t,
            name: patch.taskName,
            startDate: patch.startDate,
            endDate: patch.endDate,
          };
        }
        return t;
      })
    );
    try {
      await updateTask(taskId, {
        taskName: patch.taskName,
        startDate: patch.startDate,
        endDate: patch.endDate,
      });
    } catch (err) {
      if (previous) {
        const restore = previous;
        setTasks((cur) => cur.map((t) => (t.id === taskId ? restore : t)));
      }
      throw err;
    }
  }

  // Create an ad-hoc task under a locked category. Renders optimistically at
  // the bottom of that category's list, then reconciles with the DB row (or
  // rolls back + rethrows so the modal surfaces the error and stays open).
  async function handleTaskCreate(values: CreateTaskValues) {
    if (!addTaskCtx) return;
    const { project, category } = addTaskCtx;
    const tempId = crypto.randomUUID();
    const optimistic: Task = {
      id: tempId,
      projectId: project.id,
      group: category,
      name: values.taskName,
      tMinusDays: 0,
      durationDays: 0,
      status: "Not Start",
      role: values.role,
      person: values.person,
      startDate: values.startDate,
      endDate: values.endDate,
    };
    setTasks((prev) => [...prev, optimistic]);
    try {
      const created = await createProjectTask({
        projectId: project.id,
        category,
        taskName: values.taskName,
        role: values.role,
        person: values.person,
        startDate: values.startDate,
        endDate: values.endDate,
        releaseDate: project.releaseDate,
      });
      setTasks((prev) => prev.map((t) => (t.id === tempId ? created : t)));
    } catch (err) {
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
      throw err;
    }
  }

  const sortedProjects = React.useMemo(
    () =>
      [...projects].sort((a, b) => a.releaseDate.localeCompare(b.releaseDate)),
    [projects]
  );

  // Project-type filter — drives the Project View, Gantt, and Kanban.
  const filteredProjects = React.useMemo(
    () => sortedProjects.filter((p) => selectedTypes.has(p.projectType)),
    [sortedProjects, selectedTypes]
  );

  const toggleType = (type: ProjectType) =>
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });

  const allTypesSelected = selectedTypes.size === PROJECT_TYPES.length;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="w-full space-y-6 px-4 py-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-foreground text-background">
              <Disc3 className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                ครึ่งเก้า — Label Ops
              </h1>
              <p className="text-sm text-muted-foreground">
                Release Dashboard · Workback Timeline
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" aria-label="กรองตามประเภทโปรเจกต์">
                  <ListFilter data-icon="inline-start" />
                  Project Types
                  <span className="ml-1 rounded-full bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">
                    {allTypesSelected ? "All" : selectedTypes.size}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-52 p-2">
                <div className="px-1 pb-1.5 text-xs font-medium text-muted-foreground">
                  Show project types
                </div>
                {PROJECT_TYPES.map((type) => (
                  <label
                    key={type}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-sm hover:bg-accent"
                  >
                    <Checkbox
                      checked={selectedTypes.has(type)}
                      onCheckedChange={() => toggleType(type)}
                    />
                    {type}
                  </label>
                ))}
              </PopoverContent>
            </Popover>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus data-icon="inline-start" />
              Create Project
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant="outline" size="icon" aria-label="Internal Work">
                  <Link href="/internal">
                    <ClipboardList />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Internal / Ad-Hoc Work</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant="outline" size="icon" aria-label="Library Map">
                  <Link href="/library">
                    <Library />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Library Map</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant="outline" size="icon" aria-label="Team Members">
                  <Link href="/settings">
                    <UserCog />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Team Members</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant="outline" size="icon" aria-label="Workflow Templates">
                  <Link href="/settings/templates">
                    <Settings />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Workflow Templates</TooltipContent>
            </Tooltip>
            <UserMenu email={userEmail ?? null} />
          </div>
        </header>

        <Tabs defaultValue={initialTab}>
          <TabsList>
            <TabsTrigger value="overview">
              <LayoutDashboard data-icon="inline-start" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="table">
              <Table2 data-icon="inline-start" />
              Project View
            </TabsTrigger>
            <TabsTrigger value="kanban">
              <SquareKanban data-icon="inline-start" />
              Team Workload
            </TabsTrigger>
            <TabsTrigger value="gantt">
              <ChartGantt data-icon="inline-start" />
              Gantt Chart
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <CalendarRange data-icon="inline-start" />
              Calendar View
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <OverviewDashboard
              projects={projects}
              tasks={tasks}
              currentPerson={currentPerson}
              onTaskUpdate={handleTaskUpdate}
              onEditTask={setEditTask}
            />
          </TabsContent>
          <TabsContent value="table">
            <ProjectTable
              projects={filteredProjects}
              tasks={tasks}
              onOpenDetails={setDetailsProject}
              onTaskUpdate={handleTaskUpdate}
              onEditProject={setEditProject}
              onDeleteProject={handleDeleteProject}
              onEditTask={setEditTask}
              onAddTask={(project, category) =>
                setAddTaskCtx({ project, category })
              }
            />
          </TabsContent>
          <TabsContent value="kanban">
            <KanbanBoard
              projects={filteredProjects}
              tasks={tasks}
              onTaskUpdate={handleTaskUpdate}
              onEditTask={setEditTask}
            />
          </TabsContent>
          <TabsContent value="gantt">
            <GanttChart
              projects={filteredProjects}
              tasks={tasks}
              onEditTask={setEditTask}
            />
          </TabsContent>
          <TabsContent value="calendar">
            <CalendarView
              projects={filteredProjects}
              tasks={tasks}
              onEditTask={setEditTask}
            />
          </TabsContent>
        </Tabs>

        <ProjectDetailsSheet
          project={detailsProject}
          tasks={tasks}
          onOpenChange={(open) => {
            if (!open) setDetailsProject(null);
          }}
        />

        {/* Create */}
        <ProjectFormDialog
          mode="create"
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSubmit={handleCreate}
          taskTemplates={taskTemplates}
        />

        {/* Edit (pre-populated; keyed so the form re-inits per project) */}
        <ProjectFormDialog
          key={editProject?.id ?? "edit"}
          mode="edit"
          open={!!editProject}
          onOpenChange={(open) => {
            if (!open) setEditProject(null);
          }}
          values={editValues}
          onSubmit={handleUpdateProject}
        />

        {/* Create ad-hoc task — category locked to the button that opened it */}
        {addTaskCtx && (
          <CreateTaskDialog
            key={`${addTaskCtx.project.id}:${addTaskCtx.category}`}
            project={addTaskCtx.project}
            category={addTaskCtx.category}
            open
            onOpenChange={(open) => {
              if (!open) setAddTaskCtx(null);
            }}
            onCreate={handleTaskCreate}
          />
        )}

        {/* Edit task (name + deadline) — keyed so fields re-init per task */}
        {editTask && (
          <EditTaskDialog
            key={editTask.id}
            task={editTask}
            project={projects.find((p) => p.id === editTask.projectId) ?? null}
            open
            onOpenChange={(open) => {
              if (!open) setEditTask(null);
            }}
            onSave={handleTaskEdit}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
