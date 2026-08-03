import { WorkloadBoard } from "@/components/workload/workload-board";
import { TeamProvider } from "@/components/team/team-provider";
import { toRoleGroups } from "@/lib/team";
import {
  getCurrentUserEmail,
  getTeamMembers,
  getWorkloadData,
} from "@/lib/queries";

export default async function WorkloadPage() {
  const [{ projects, tasks, dependencies }, userEmail, members] =
    await Promise.all([
      getWorkloadData(),
      getCurrentUserEmail(),
      getTeamMembers(),
    ]);
  return (
    <TeamProvider groups={toRoleGroups(members)}>
      <WorkloadBoard
        initialProjects={projects}
        initialTasks={tasks}
        initialDependencies={dependencies}
        userEmail={userEmail}
      />
    </TeamProvider>
  );
}
