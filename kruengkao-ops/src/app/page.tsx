import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getDashboardData } from "@/lib/queries";

export default async function Home() {
  const { projects, tasks } = await getDashboardData();
  return <DashboardShell initialProjects={projects} initialTasks={tasks} />;
}
