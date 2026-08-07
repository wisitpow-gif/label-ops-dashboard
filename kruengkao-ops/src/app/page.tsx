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

  // Link the signed-in user to their team-member name (via email) so the
  // "My Tasks" section can filter by assignee.
  const normalizedEmail = userEmail?.toLowerCase() ?? null;
  const currentPerson = normalizedEmail
    ? (members.find((m) => m.email?.toLowerCase() === normalizedEmail)?.name ??
      null)
    : null;

  return (
    <TeamProvider groups={toRoleGroups(members)}>
      <DashboardShell
        initialProjects={projects}
        initialTasks={tasks}
        userEmail={userEmail}
        taskTemplates={templates}
        currentPerson={currentPerson}
      />
    </TeamProvider>
  );
}
