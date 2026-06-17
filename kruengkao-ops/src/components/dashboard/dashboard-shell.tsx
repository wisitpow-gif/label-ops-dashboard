"use client";

import * as React from "react";
import {
  ChartGantt,
  Disc3,
  ListFilter,
  Plus,
  SquareKanban,
  Table2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { parseDate, toISODate } from "@/lib/dates";
import { LABELS } from "@/lib/constants";
import { LABEL_FILTER_ALL } from "@/lib/mock-data";
import type { Project, Task } from "@/lib/types";
import { createProject } from "@/app/actions";
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
  const [selectedLabel, setSelectedLabel] =
    React.useState<string>(LABEL_FILTER_ALL);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editProject, setEditProject] = React.useState<Project | null>(null);

  // Persist the new project + its template tasks, then merge into local state.
  async function handleCreate(values: NewProjectInput) {
    const { project, tasks: newTasks } = await createProject({
      songTitle: values.songTitle,
      artist: values.artist,
      label: values.label,
      releaseDate: toISODate(values.releaseDate),
    });
    setProjects((prev) => [...prev, project]);
    setTasks((prev) => [...prev, ...newTasks]);
  }

  // Edit / Delete — local state only for now (Supabase wiring comes next).
  function handleUpdateProject(values: NewProjectInput) {
    if (!editProject) return;
    const id = editProject.id;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              songName: values.songTitle,
              artistName: values.artist,
              label: values.label,
              releaseDate: toISODate(values.releaseDate),
            }
          : p
      )
    );
    setEditProject(null);
  }

  function handleDeleteProject(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setTasks((prev) => prev.filter((t) => t.projectId !== id));
    setDetailsProject((prev) => (prev?.id === id ? null : prev));
  }

  // Project → form values for the edit dialog (releaseDate string → Date)
  const editValues: NewProjectInput | undefined = editProject
    ? {
        songTitle: editProject.songName,
        artist: editProject.artistName,
        label: editProject.label,
        releaseDate: parseDate(editProject.releaseDate),
      }
    : undefined;

  // Patch a single sub-task; pack roll-ups recompute from this state on render
  const handleTaskUpdate = React.useCallback(
    (taskId: string, patch: Partial<Task>) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t))
      );
    },
    []
  );

  const sortedProjects = React.useMemo(
    () =>
      [...projects].sort((a, b) => a.releaseDate.localeCompare(b.releaseDate)),
    [projects]
  );

  // Global label filter — drives both the Project View and the Gantt Chart
  const filteredProjects = React.useMemo(
    () =>
      selectedLabel === LABEL_FILTER_ALL
        ? sortedProjects
        : sortedProjects.filter((p) => p.label === selectedLabel),
    [sortedProjects, selectedLabel]
  );

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
            <Select value={selectedLabel} onValueChange={setSelectedLabel}>
              <SelectTrigger className="w-[180px]" aria-label="กรองตามสังกัด">
                <ListFilter className="size-4 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={LABEL_FILTER_ALL}>{LABEL_FILTER_ALL}</SelectItem>
                <SelectSeparator />
                {LABELS.map((label) => (
                  <SelectItem key={label} value={label}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus data-icon="inline-start" />
              Create Project
            </Button>
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
