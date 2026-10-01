"use client";

import { OverviewDashboard } from "@/components/dashboard/overview-dashboard";
import { useApp } from "@/components/app/app-provider";

export default function OverviewPage() {
  const { projects, tasks, currentPerson, onTaskUpdate, onEditTask } = useApp();
  return (
    <OverviewDashboard
      projects={projects}
      tasks={tasks}
      currentPerson={currentPerson}
      onTaskUpdate={onTaskUpdate}
      onEditTask={onEditTask}
    />
  );
}
