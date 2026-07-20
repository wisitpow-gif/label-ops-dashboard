"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChartGantt,
  Disc3,
  ListFilter,
  Plus,
  Settings,
  SquareKanban,
  Table2,
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
import type { Project, ProjectType, Task } from "@/lib/types";
import { toast } from "sonner";

import {
  createProject,
  deleteProject,
  updateProject,
  updateTask,
} from "@/app/actions";
import { AssetHubDialog } from "./asset-hub-dialog";
import { GanttChart } from "./gantt-chart";
import { KanbanBoard } from "./kanban-board";
import {
  ProjectFormDialog,
  type NewProjectInput,
} from "./project-form-dialog";
import { ProjectDetailsSheet } from "./project-details-sheet";
import { ProjectTable } from "./project-table";

export function DashboardShell({
  initialProjects,
  initialTasks,
}: {
  initialProjects: Project[];
  initialTasks: Task[];
}) {
  const [projects, setProjects] = React.useState<Project[]>(initialProjects);
  const [tasks, setTasks] = React.useState<Task[]>(initialTasks);
  const [detailsProject, setDetailsProject] = React.useState<Project | null>(
    null
  );
  const [assetsProject, setAssetsProject] = React.useState<Project | null>(
    null
  );
  // Multi-select project-type filter — all types shown by default.
  const [selectedTypes, setSelectedTypes] = React.useState<Set<ProjectType>>(
    () => new Set(PROJECT_TYPES)
  );
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editProject, setEditProject] = React.useState<Project | null>(null);

  // Persist the new project + its template tasks, then merge into local state.
  async function handleCreate(values: NewProjectInput) {
    const { project, tasks: newTasks } = await createProject({
      songTitle: values.songTitle,
      artist: values.artist,
      label: values.label,
      projectType: values.projectType,
      releaseDate: toISODate(values.releaseDate),
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
        assetUrl: patch.assetUrl,
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
      <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
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
                <Button asChild variant="outline" size="icon" aria-label="Workflow Templates">
                  <Link href="/settings/templates">
                    <Settings />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Workflow Templates</TooltipContent>
            </Tooltip>
          </div>
        </header>

        <Tabs defaultValue="table">
          <TabsList>
            <TabsTrigger value="table">
              <Table2 data-icon="inline-start" />
              Project View
            </TabsTrigger>
            <TabsTrigger value="gantt">
              <ChartGantt data-icon="inline-start" />
              Gantt Chart
            </TabsTrigger>
            <TabsTrigger value="kanban">
              <SquareKanban data-icon="inline-start" />
              Kanban Board
            </TabsTrigger>
          </TabsList>
          <TabsContent value="table">
            <ProjectTable
              projects={filteredProjects}
              tasks={tasks}
              onOpenDetails={setDetailsProject}
              onOpenAssets={setAssetsProject}
              onTaskUpdate={handleTaskUpdate}
              onEditProject={setEditProject}
              onDeleteProject={handleDeleteProject}
            />
          </TabsContent>
          <TabsContent value="gantt">
            <GanttChart projects={filteredProjects} tasks={tasks} />
          </TabsContent>
          <TabsContent value="kanban">
            <KanbanBoard
              projects={filteredProjects}
              tasks={tasks}
              onTaskUpdate={handleTaskUpdate}
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

        <AssetHubDialog
          project={assetsProject}
          tasks={tasks}
          onOpenChange={(open) => {
            if (!open) setAssetsProject(null);
          }}
        />

        {/* Create */}
        <ProjectFormDialog
          mode="create"
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSubmit={handleCreate}
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
      </div>
    </TooltipProvider>
  );
}
