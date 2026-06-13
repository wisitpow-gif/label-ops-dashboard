"use client";

import * as React from "react";
import { ChartGantt, Disc3, ListFilter, Table2 } from "lucide-react";

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
import { toISODate } from "@/lib/dates";
import {
  LABELS,
  LABEL_FILTER_ALL,
  PROJECTS,
  TASKS,
  generateTasks,
} from "@/lib/mock-data";
import type { Project, Task } from "@/lib/types";
import {
  CreateProjectDialog,
  type NewProjectInput,
} from "./create-project-dialog";
import { GanttChart } from "./gantt-chart";
import { ProjectDetailsSheet } from "./project-details-sheet";
import { ProjectTable } from "./project-table";

export function DashboardShell() {
  const [projects, setProjects] = React.useState<Project[]>(PROJECTS);
  const [tasks, setTasks] = React.useState<Task[]>(TASKS);
  const [detailsProject, setDetailsProject] = React.useState<Project | null>(
    null
  );
  const [selectedLabel, setSelectedLabel] =
    React.useState<string>(LABEL_FILTER_ALL);

  function handleCreate(values: NewProjectInput) {
    const id = crypto.randomUUID();
    const project: Project = {
      id,
      songName: values.songTitle,
      artistName: values.artist,
      label: values.label,
      releaseDate: toISODate(values.releaseDate),
    };
    setProjects((prev) => [...prev, project]);
    // "Generate Timeline": stamp the full workback task template onto the
    // new project (all Not Start; deadlines derive from the release date)
    setTasks((prev) => [...prev, ...generateTasks(id)]);
  }

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
            <CreateProjectDialog onCreate={handleCreate} />
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
          </TabsList>
          <TabsContent value="table">
            <ProjectTable
              projects={filteredProjects}
              tasks={tasks}
              onOpenDetails={setDetailsProject}
            />
          </TabsContent>
          <TabsContent value="gantt">
            <GanttChart projects={filteredProjects} tasks={tasks} />
          </TabsContent>
        </Tabs>

        <ProjectDetailsSheet
          project={detailsProject}
          tasks={tasks}
          onOpenChange={(open) => {
            if (!open) setDetailsProject(null);
          }}
        />
      </div>
    </TooltipProvider>
  );
}
