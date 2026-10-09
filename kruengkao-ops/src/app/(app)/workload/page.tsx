"use client";

import { KanbanBoard } from "@/components/dashboard/kanban-board";
import { useApp } from "@/components/app/app-provider";

export default function WorkloadPage() {
  const { filteredProjects, tasks, onTaskUpdate, onEditTask } = useApp();
  return (
    <KanbanBoard
      projects={filteredProjects}
      tasks={tasks}
      onTaskUpdate={onTaskUpdate}
      onEditTask={onEditTask}
    />
  );
}
