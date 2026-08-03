import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { TeamProvider } from "@/components/team/team-provider";
import { toRoleGroups } from "@/lib/team";
import {
  getCurrentUserEmail,
  getDashboardData,
  getTaskTemplates,
  getTeamMembers,
} from "@/lib/queries";

export default async function Home() {
  const [{ projects, tasks }, userEmail, members, templates] =
    await Promise.all([
      getDashboardData(),
      getCurrentUserEmail(),
      getTeamMembers(),
      getTaskTemplates(),
    ]);
  return (
    <TeamProvider groups={toRoleGroups(members)}>
      <DashboardShell
        initialProjects={projects}
        initialTasks={tasks}
        userEmail={userEmail}
        taskTemplates={templates}
      />
    </TeamProvider>
  );
}
