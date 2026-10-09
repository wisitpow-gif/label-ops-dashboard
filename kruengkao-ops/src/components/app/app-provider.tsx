"use client";

import * as React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { parseDate, toISODate } from "@/lib/dates";
import { PROJECT_TYPES } from "@/lib/constants";
import type { Project, ProjectType, Task, TaskGroup, TaskTemplate } from "@/lib/types";
import { toast } from "sonner";

import {
  createProject,
  createProjectTask,
  deleteProject,
  updateProject,
  updateTask,
} from "@/app/actions";
import {
  CreateTaskDialog,
  type CreateTaskValues,
} from "@/components/dashboard/create-task-dialog";
import {
  EditTaskDialog,
  type EditTaskPatch,
} from "@/components/dashboard/edit-task-dialog";
import {
  ProjectFormDialog,
  type NewProjectInput,
  type ProjectFormSubmit,
} from "@/components/dashboard/project-form-dialog";
import { ProjectDetailsSheet } from "@/components/dashboard/project-details-sheet";
import { AppHeader } from "./app-header";

/**
 * Shared app state for every module route. Lives in the (app) layout so it
 * persists across client-side navigation between modules — optimistic edits
 * and open modals survive moving from /releases to /gantt, etc.
 */
interface AppContextValue {
  /** All release projects (unfiltered) — e.g. the Overview "My Tasks". */
  projects: Project[];
  tasks: Task[];
  /** Projects narrowed by the Project-Type filter + sorted by release date. */
  filteredProjects: Project[];
  currentPerson: string | null;
  onTaskUpdate: (taskId: string, patch: Partial<Task>) => void;
  onEditTask: (task: Task) => void;
  onOpenDetails: (project: Project) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onAddTask: (project: Project, category: TaskGroup) => void;
}

const AppContext = React.createContext<AppContextValue | null>(null);

/** Read the shared module state. Must be used under an AppProvider. */
export function useApp(): AppContextValue {
  const ctx = React.useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within <AppProvider>");
  return ctx;
}

export function AppProvider({
  initialProjects,
  initialTasks,
  userEmail,
  taskTemplates = [],
  currentPerson = null,
  children,
}: {
  initialProjects: Project[];
  initialTasks: Task[];
  userEmail?: string | null;
  taskTemplates?: TaskTemplate[];
  currentPerson?: string | null;
  children: React.ReactNode;
}) {
  const [projects, setProjects] = React.useState<Project[]>(initialProjects);
  const [tasks, setTasks] = React.useState<Task[]>(initialTasks);
  const [detailsProject, setDetailsProject] = React.useState<Project | null>(
    null
  );
  const [selectedTypes, setSelectedTypes] = React.useState<Set<ProjectType>>(
    () => new Set(PROJECT_TYPES)
  );
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editProject, setEditProject] = React.useState<Project | null>(null);
  const [editTask, setEditTask] = React.useState<Task | null>(null);
  const [addTaskCtx, setAddTaskCtx] = React.useState<{
    project: Project;
    category: TaskGroup;
  } | null>(null);

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

  const editValues: NewProjectInput | undefined = editProject
    ? {
        songTitle: editProject.songName,
        artist: editProject.artistName,
        label: editProject.label,
        projectType: editProject.projectType,
        releaseDate: parseDate(editProject.releaseDate),
      }
    : undefined;

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

  const value: AppContextValue = {
    projects,
    tasks,
    filteredProjects,
    currentPerson,
    onTaskUpdate: handleTaskUpdate,
    onEditTask: setEditTask,
    onOpenDetails: setDetailsProject,
    onEditProject: setEditProject,
    onDeleteProject: handleDeleteProject,
    onAddTask: (project, category) => setAddTaskCtx({ project, category }),
  };

  return (
    <TooltipProvider delayDuration={150}>
      <AppContext.Provider value={value}>
        <div className="w-full space-y-6 px-4 py-6">
          <AppHeader
            userEmail={userEmail}
            selectedTypes={selectedTypes}
            allTypesSelected={selectedTypes.size === PROJECT_TYPES.length}
            onToggleType={toggleType}
            onCreate={() => setCreateOpen(true)}
          />
          {children}
        </div>

        <ProjectDetailsSheet
          project={detailsProject}
          tasks={tasks}
          onOpenChange={(open) => {
            if (!open) setDetailsProject(null);
          }}
        />

        <ProjectFormDialog
          mode="create"
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSubmit={handleCreate}
          taskTemplates={taskTemplates}
        />

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
            currentAuthor={currentPerson ?? userEmail ?? "ฉัน"}
          />
        )}
      </AppContext.Provider>
    </TooltipProvider>
  );
}
