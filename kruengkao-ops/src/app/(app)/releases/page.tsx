"use client";

import { ProjectTable } from "@/components/dashboard/project-table";
import { useApp } from "@/components/app/app-provider";

export default function ReleasesPage() {
  const {
    filteredProjects,
    tasks,
    onOpenDetails,
    onTaskUpdate,
    onEditProject,
    onDeleteProject,
    onEditTask,
    onAddTask,
  } = useApp();
  return (
    <ProjectTable
      projects={filteredProjects}
      tasks={tasks}
      onOpenDetails={onOpenDetails}
      onTaskUpdate={onTaskUpdate}
      onEditProject={onEditProject}
      onDeleteProject={onDeleteProject}
      onEditTask={onEditTask}
      onAddTask={onAddTask}
    />
  );
}
