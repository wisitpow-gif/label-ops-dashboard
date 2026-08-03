import { InternalWorkspace } from "@/components/internal/internal-workspace";
import { TeamProvider } from "@/components/team/team-provider";
import { toRoleGroups } from "@/lib/team";
import {
  getCurrentUserEmail,
  getInternalWorkspace,
  getTeamMembers,
} from "@/lib/queries";

export default async function InternalPage() {
  const [{ projects, tasks, dependencies }, userEmail, members] =
    await Promise.all([
      getInternalWorkspace(),
      getCurrentUserEmail(),
      getTeamMembers(),
    ]);
  return (
    <TeamProvider groups={toRoleGroups(members)}>
      <InternalWorkspace
        initialProjects={projects}
        initialTasks={tasks}
        initialDependencies={dependencies}
        userEmail={userEmail}
      />
    </TeamProvider>
  );
}
