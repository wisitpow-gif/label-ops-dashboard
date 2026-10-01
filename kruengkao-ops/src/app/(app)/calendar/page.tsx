"use client";

import { CalendarView } from "@/components/dashboard/calendar-view";
import { useApp } from "@/components/app/app-provider";

export default function CalendarPage() {
  const { filteredProjects, tasks, onEditTask } = useApp();
  return (
    <CalendarView projects={filteredProjects} tasks={tasks} onEditTask={onEditTask} />
  );
}
