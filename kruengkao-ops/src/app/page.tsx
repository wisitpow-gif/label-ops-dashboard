import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { TeamProvider } from "@/components/team/team-provider";
import { toRoleGroups } from "@/lib/team";
import {
  getCurrentUserEmail,
  getDashboardData,
  getTaskTemplates,
  getTeamMembers,
} from "@/lib/queries";

const DASHBOARD_TABS = ["overview", "table", "kanban", "gantt", "calendar"];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ projects, tasks }, userEmail, members, templates, { tab }] =
    await Promise.all([
      getDashboardData(),
      getCurrentUserEmail(),
      getTeamMembers(),
      getTaskTemplates(),
      searchParams,
    ]);

  // Open the tab requested via ?tab= (e.g. the Digital Library "back" link
  // returns to Project View); fall back to Overview for unknown/absent values.
  const initialTab = tab && DASHBOARD_TABS.includes(tab) ? tab : "overview";

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
        initialTab={initialTab}
      />
    </TeamProvider>
  );
}
