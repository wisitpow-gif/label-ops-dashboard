"use client";

import { GanttChart } from "@/components/dashboard/gantt-chart";
import { useApp } from "@/components/app/app-provider";

export default function GanttPage() {
  const { filteredProjects, tasks, onEditTask } = useApp();
  return (
    <GanttChart projects={filteredProjects} tasks={tasks} onEditTask={onEditTask} />
  );
}
