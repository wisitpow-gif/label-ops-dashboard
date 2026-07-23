import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getCurrentUserEmail, getDashboardData } from "@/lib/queries";

export default async function Home() {
  const [{ projects, tasks }, userEmail] = await Promise.all([
    getDashboardData(),
    getCurrentUserEmail(),
  ]);
  return (
    <DashboardShell
      initialProjects={projects}
      initialTasks={tasks}
      userEmail={userEmail}
    />
  );
}
