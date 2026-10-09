import { TeamProvider } from "@/components/team/team-provider";
import { AppProvider } from "@/components/app/app-provider";
import { toRoleGroups } from "@/lib/team";
import {
  getCurrentUserEmail,
  getDashboardData,
  getLabelsWithArtists,
  getTaskTemplates,
  getTeamMembers,
} from "@/lib/queries";

/**
 * Shared shell for every module route (/overview, /releases, /workload,
 * /gantt, /calendar). Data is fetched once here and lives in AppProvider, so
 * it persists across client-side navigation between modules — and a direct
 * deep-link to any single module (for the portal) loads it standalone.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ projects, tasks }, userEmail, members, templates, labels] =
    await Promise.all([
      getDashboardData(),
      getCurrentUserEmail(),
      getTeamMembers(),
      getTaskTemplates(),
      getLabelsWithArtists(),
    ]);

  const normalizedEmail = userEmail?.toLowerCase() ?? null;
  const currentPerson = normalizedEmail
    ? (members.find((m) => m.email?.toLowerCase() === normalizedEmail)?.name ??
      null)
    : null;

  return (
    <TeamProvider groups={toRoleGroups(members)}>
      <AppProvider
        initialProjects={projects}
        initialTasks={tasks}
        userEmail={userEmail}
        taskTemplates={templates}
        currentPerson={currentPerson}
        labels={labels}
      >
        {children}
      </AppProvider>
    </TeamProvider>
  );
}
